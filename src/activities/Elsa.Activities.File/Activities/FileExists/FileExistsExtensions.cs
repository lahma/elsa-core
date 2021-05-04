using Elsa.Builders;
using Elsa.Services.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Elsa.Activities.File
{
    public static class FileExistsExtensions
    {
        public static ISetupActivity<FileExists> WithPath(this ISetupActivity<FileExists> setup, Func<ActivityExecutionContext, ValueTask<string>> path) => setup.Set(x => x.Path, path);
        public static ISetupActivity<FileExists> WithPath(this ISetupActivity<FileExists> setup, Func<ActivityExecutionContext, string> path) => setup.Set(x => x.Path, path);
        public static ISetupActivity<FileExists> WithPath(this ISetupActivity<FileExists> setup, Func<ValueTask<string>> path) => setup.Set(x => x.Path, path);
        public static ISetupActivity<FileExists> WithPath(this ISetupActivity<FileExists> setup, Func<string> path) => setup.Set(x => x.Path, path);
        public static ISetupActivity<FileExists> WithPath(this ISetupActivity<FileExists> setup, string path) => setup.Set(x => x.Path, path);
    }
}
