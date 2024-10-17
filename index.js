(() => {

    async function bootstrap() {
        const { ShellSdk } = FSMShell;

        if (ShellSdk.isInsideShell()) {
            common.setShellSdk(ShellSdk.init(parent, '*'));
        } else {
            utils.setFieldValue('#error', 'Unable to reach shell event API');
            throw new Error('Unable to reach shell event API');
        }
    }

    bootstrap();
    my_extension.testMyExtension();

})();