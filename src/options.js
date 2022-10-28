export const parseOptions = (argv, defaultOptions) => {
    var options = defaultOptions;

    argv.forEach(arg => {
        // format: --name=value
        if (arg.startsWith('--') && arg.includes('=')) {
            var name = arg.substring(2).split('=')[0];
            options[name] = arg.split('=')[1];
        }
    });

    return options;
};
