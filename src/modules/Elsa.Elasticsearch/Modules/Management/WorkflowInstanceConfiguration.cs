using Elsa.Elasticsearch.Options;
using Elsa.Elasticsearch.Services;
using Elsa.Workflows.Management.Entities;
using Nest;

namespace Elsa.Elasticsearch.Modules.Management;

public class WorkflowInstanceConfiguration : IElasticConfiguration
{
    public const string IndexName = "workflow-instance";
    
    public void Apply(ConnectionSettings connectionSettings, ElasticsearchOptions options)
    {
        connectionSettings.DefaultMappingFor<WorkflowInstance>(m => 
            m.IndexName(IElasticConfiguration.ResolveIndexName<WorkflowInstance>(options, IndexName)));
    }
}