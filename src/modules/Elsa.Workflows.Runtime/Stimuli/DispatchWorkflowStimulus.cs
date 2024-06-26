using Elsa.Workflows.Runtime.Activities;

namespace Elsa.Workflows.Runtime.Stimuli;

/// <summary>
/// Bookmark payload for the <see cref="DispatchWorkflow"/> activity.
/// </summary>
/// <param name="ChildInstanceId">The instance ID of the child workflow that was created by the <see cref="DispatchWorkflow"/> activity.</param>
public record DispatchWorkflowStimulus(string ChildInstanceId);