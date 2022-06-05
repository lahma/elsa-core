import {Component, Event, EventEmitter, h, Method, Prop, State} from '@stencil/core';
import {camelCase} from 'lodash';
import WorkflowEditorTunnel from '../state';
import {
  Activity,
  ActivityDescriptor,
  DefaultActions, InputDescriptor, RenderActivityInputContext,
  RenderActivityPropsContext,
  TabChangedArgs,
  TabDefinition
} from '../../../models';
import {InputDriverRegistry} from "../../../services";
import {Container} from "typedi";
import {ActivityInputContext} from "../../../services/node-input-driver";
import {FormEntry} from "../../shared/forms/form-entry";
import {isNullOrWhitespace} from "../../../utils";

export interface ActivityUpdatedArgs {
  activity: Activity;
  activityDescriptor: ActivityDescriptor;
  propertyName?: string;
  inputDescriptor?: InputDescriptor;
}

export interface DeleteActivityRequestedArgs {
  activity: Activity;
}

@Component({
  tag: 'elsa-activity-properties-editor',
})
export class ActivityPropertiesEditor {
  private slideOverPanel: HTMLElsaSlideOverPanelElement;
  private renderContext: RenderActivityPropsContext;
  private readonly inputDriverRegistry: InputDriverRegistry;

  constructor() {
    this.inputDriverRegistry = Container.get(InputDriverRegistry);
  }

  @Prop({mutable: true}) public activityDescriptors: Array<ActivityDescriptor> = [];
  @Prop({mutable: true}) public activity?: Activity;

  @Event() public activityUpdated: EventEmitter<ActivityUpdatedArgs>;
  @Event() public deleteActivityRequested: EventEmitter<DeleteActivityRequestedArgs>;
  @State() private selectedTabIndex: number = 0;

  @Method()
  public async show(): Promise<void> {
    await this.slideOverPanel.show();
  }

  @Method()
  public async hide(): Promise<void> {
    await this.slideOverPanel.hide();
  }

  public componentWillRender() {
    const activity = this.activity;
    const activityDescriptor = this.findActivityDescriptor();
    const title = activityDescriptor?.displayName ?? activityDescriptor?.activityType ?? 'Unknown Activity';
    const driverRegistry = this.inputDriverRegistry;

    const renderInputPropertyContexts: Array<RenderActivityInputContext> = activityDescriptor.inputProperties.map(inputDescriptor => {
      const renderInputContext: ActivityInputContext = {
        node: activity,
        nodeDescriptor: activityDescriptor,
        inputDescriptor,
        notifyInputChanged: () => this.activityUpdated.emit({activity, activityDescriptor, propertyName: camelCase(inputDescriptor.name), inputDescriptor}),
        inputChanged: (v, s) => this.onPropertyEditorChanged(inputDescriptor, v, s)
      };

      const driver = driverRegistry.get(renderInputContext);
      const control = driver?.renderInput(renderInputContext);

      return {
        inputContext: renderInputContext,
        inputControl: control,
      }
    });

    this.renderContext = {
      activity,
      activityDescriptor,
      title,
      inputProperties: renderInputPropertyContexts
    }
  }

  public render() {
    const {activity, activityDescriptor, title} = this.renderContext;

    const commonTab: TabDefinition = {
      displayText: 'Common',
      content: () => this.renderCommonTab()
    };

    const inputTab: TabDefinition = {
      displayText: 'Input',
      content: () => this.renderInputTab()
    };

    const tabs = !!activityDescriptor ? [commonTab, inputTab] : [];

    if (activityDescriptor.outputProperties.length > 0) {
      const outputTab: TabDefinition = {
        displayText: 'Output',
        content: () => this.renderOutputTab()
      };

      tabs.push(outputTab);
    }

    const actions = [DefaultActions.Delete(this.onDeleteActivity)];
    const mainTitle = activity.id;
    const subTitle = activityDescriptor.displayName;

    return (
      <elsa-form-panel
        mainTitle={mainTitle}
        subTitle={subTitle}
        tabs={tabs}
        selectedTabIndex={this.selectedTabIndex}
        onSelectedTabIndexChanged={e => this.onSelectedTabIndexChanged(e)}
        actions={actions}/>
    );
  }

  private findActivityDescriptor = (): ActivityDescriptor => !!this.activity ? this.activityDescriptors.find(x => x.activityType == this.activity.typeName) : null;
  private onSelectedTabIndexChanged = (e: CustomEvent<TabChangedArgs>) => this.selectedTabIndex = e.detail.selectedTabIndex

  private onActivityIdChanged = (e: any) => {
    const activity = this.activity;
    const inputElement = e.target as HTMLInputElement;

    activity.id = inputElement.value;
    const activityDescriptor = this.findActivityDescriptor();
    const inputDescriptor: InputDescriptor = {
      name: 'Id',
      displayName: 'Id',
      type: 'string'
    };
    this.activityUpdated.emit({activity, activityDescriptor, propertyName: 'id', inputDescriptor});
  }

  private onActivityDisplayTextChanged(e: any) {
    const activity = this.activity;
    const inputElement = e.target as HTMLInputElement;

    activity.metadata = {
      ...activity.metadata,
      displayText: inputElement.value
    };

    const activityDescriptor = this.findActivityDescriptor();
    this.activityUpdated.emit({activity, activityDescriptor});
  }

  private onPropertyEditorChanged = (inputDescriptor: InputDescriptor, propertyValue: any, syntax: string) => {
    const activity = this.activity;
    const propertyName = inputDescriptor.name;
    const activityDescriptor = this.findActivityDescriptor();
    const camelCasePropertyName = camelCase(propertyName);

    activity[camelCasePropertyName] = {
      type: inputDescriptor.type,
      expression: {
        type: syntax,
        value: propertyValue // TODO: The "value" field is currently hardcoded, but we should be able to be more flexible and potentially have different fields for a given syntax.
      }
    };

    this.activityUpdated.emit({activity, activityDescriptor, propertyName: camelCasePropertyName, inputDescriptor});
  }

  private onDeleteActivity = () => this.deleteActivityRequested.emit({activity: this.activity});

  private renderCommonTab = () => {
    const {activity,} = this.renderContext;
    const activityId = activity.id;
    const displayText: string = activity.metadata?.displayText ?? '';
    const key = `${activityId}`;

    return <div key={key}>
      <FormEntry fieldId="ActivityId" label="ID" hint="The ID of the activity.">
        <input type="text" name="ActivityId" id="ActivityId" value={activityId} onChange={e => this.onActivityIdChanged(e)}/>
      </FormEntry>

      <FormEntry fieldId="ActivityDisplayText" label="Display Text" hint="The text to display on the activity in the designer.">
        <input type="text" name="ActivityDisplayText" id="ActivityDisplayText" value={displayText} onChange={e => this.onActivityDisplayTextChanged(e)}/>
      </FormEntry>

    </div>
  };

  private renderInputTab = () => {
    const {activity, inputProperties} = this.renderContext;
    const activityId = activity.id;
    const key = `${activityId}`;

    return <div key={key}>
      {inputProperties.filter(x => !!x.inputControl).map(propertyContext => {
        const key = `${activity.id}-${propertyContext.inputContext.inputDescriptor.name}`;
        return <div key={key}>
          {propertyContext.inputControl}
        </div>;
      })}
    </div>
  };

  private renderOutputTab = () => {
    const {activity, activityDescriptor} = this.renderContext;
    const outputProperties = activityDescriptor.outputProperties;
    const activityId = activity.id;
    const key = `${activityId}`;

    return <div key={key}>
      {outputProperties.map(property => {
        const key = `${activity.id}-${property.name}`;
        const displayName = isNullOrWhitespace(property.displayName) ? property.name : property.displayName;

        return <div key={key}>
          <FormEntry fieldId={key} label={displayName} hint={property.description}>
            <select>
              <option>CurrentValue</option>
              <option>Variable 2</option>
              <option>Variable 3</option>
            </select>
          </FormEntry>
        </div>;
      })}
    </div>
  };
}

WorkflowEditorTunnel.injectProps(ActivityPropertiesEditor, ['activityDescriptors']);