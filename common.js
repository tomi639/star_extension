const common = (() => {
    const CLIENT_ID = 'MyExtension';
    const CLIENT_VERSION = '1.0.0'

    const { SHELL_EVENTS } = FSMShell;

    let _shellSdk = null;
    let _context = null;
    let _context_valid_until = null;


    function setShellSdk(shellSdk) {
        _shellSdk = shellSdk;
    }

    function getShellSdk() {
        if (!_shellSdk) {
            throw new Error('SHELL_SDK has not been set!');
        }
        return _shellSdk;
    }

    function getContext() {
        const { SHELL_EVENTS } = FSMShell;

        if (_context && Date.now() < _context_valid_until) {
            return Promise.resolve(_context);
        }

        console.log('🚀 ~ common.js ~ 🚀  Requesting context...');

        return new Promise((resolve) => {
            _shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, {
                clientIdentifier: CLIENT_ID,
                auth: {
                    response_type: 'token'
                }
            });

            _shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, (event) => {
                console.log('🚀 ~ common.js ~ 🚀  Context received...');
                _context = JSON.parse(event);
                _context_valid_until = Date.now() + _context.auth.expires_in * 1000 - 3000;
                resolve(_context);
            });
        });
    }

    async function getHeaders() {
        const context = await common.getContext();
        return {
            'Accept': 'application/json',
            'Authorization': `Bearer ${context.auth.access_token}`,
            'Content-Type': 'application/json',
            'X-Client-ID': CLIENT_ID,
            'X-Client-Version': CLIENT_VERSION
        };
    }

    async function getSearchParams() {
        const context = await common.getContext();
        return {
            account: context.account,
            company: context.company
        };
    }

    return {
        setShellSdk,
        getShellSdk,
        getContext,
        getHeaders,
        getSearchParams
    }

})();