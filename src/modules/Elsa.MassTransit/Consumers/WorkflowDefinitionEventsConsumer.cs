using Elsa.MassTransit.Messages;
using Elsa.Workflows.Contracts;
using Elsa.Workflows.Management.Activities.WorkflowDefinitionActivity;
using JetBrains.Annotations;
using MassTransit;

namespace Elsa.MassTransit.Consumers;

/// <summary>
/// Consumes messages related to workflow definition changes.
/// </summary>
[PublicAPI]
public class WorkflowDefinitionEventsConsumer(IActivityRegistryUpdateService activityRegistryUpdateService) :
    IConsumer<WorkflowDefinitionCreated>,
    IConsumer<WorkflowDefinitionDeleted>,
    IConsumer<WorkflowDefinitionPublished>,
    IConsumer<WorkflowDefinitionRetracted>,
    IConsumer<WorkflowDefinitionsDeleted>,
    IConsumer<WorkflowDefinitionVersionDeleted>,
    IConsumer<WorkflowDefinitionVersionsDeleted>,
    IConsumer<WorkflowDefinitionVersionsUpdated>
{
    /// <inheritdoc />
    public Task Consume(ConsumeContext<WorkflowDefinitionCreated> context)
    {
        return UpdateDefinition(context.Message.Id, context.Message.UsableAsActivity);
    }

    /// <inheritdoc />
    public Task Consume(ConsumeContext<WorkflowDefinitionDeleted> context)
    { 
        activityRegistryUpdateService.RemoveDefinitionFromRegistry(typeof(WorkflowDefinitionActivityProvider), context.Message.Id);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task Consume(ConsumeContext<WorkflowDefinitionPublished> context)
    {
        return UpdateDefinition(context.Message.Id, context.Message.UsableAsActivity);
    }

    /// <inheritdoc />
    public Task Consume(ConsumeContext<WorkflowDefinitionRetracted> context)
    {
        activityRegistryUpdateService.RemoveDefinitionVersionFromRegistry(typeof(WorkflowDefinitionActivityProvider), context.Message.Id);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task Consume(ConsumeContext<WorkflowDefinitionsDeleted> context)
    {
        foreach (var id in context.Message.Ids)
        {
            activityRegistryUpdateService.RemoveDefinitionFromRegistry(typeof(WorkflowDefinitionActivityProvider), id);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task Consume(ConsumeContext<WorkflowDefinitionVersionDeleted> context)
    {
        activityRegistryUpdateService.RemoveDefinitionVersionFromRegistry(typeof(WorkflowDefinitionActivityProvider), context.Message.Id);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task Consume(ConsumeContext<WorkflowDefinitionVersionsDeleted> context)
    {
        foreach (var id in context.Message.Ids)
        {
            activityRegistryUpdateService.RemoveDefinitionVersionFromRegistry(typeof(WorkflowDefinitionActivityProvider), id);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public async Task Consume(ConsumeContext<WorkflowDefinitionVersionsUpdated> context)
    {
        foreach (KeyValuePair<string,bool> definitionAsActivity in context.Message.DefinitionsAsActivity)
        {
            await UpdateDefinition(definitionAsActivity.Key, definitionAsActivity.Value);
        }
    }

    private Task UpdateDefinition(string id, bool usableAsActivity)
    {
        if (usableAsActivity)
            return activityRegistryUpdateService.AddToRegistry(typeof(WorkflowDefinitionActivityProvider), id);

        activityRegistryUpdateService.RemoveDefinitionVersionFromRegistry(typeof(WorkflowDefinitionActivityProvider), id);
        return Task.CompletedTask;
    }
}