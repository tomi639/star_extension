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
    /**
     * 
     * @param {string} [udoMetaName] 
     * @returns {Promise<{id:string, udoId: string, name: string, description:string}[]>}
     */
    async function fetchUdfMeta(udoMetaName) {
        const response = await fetch(
            'https://eu.fsm.cloud.sap/api/query/v1?' + new URLSearchParams({
                ...await common.getSearchParams(),
                dtos: 'UdfMeta.19;UdoMeta.9'
            }), {
            method: 'POST',
            headers: await common.getHeaders(),
            body: JSON.stringify({
                query:
                    `SELECT
                        udf_meta.id AS id,
                        udf_meta.description AS description,
                        udf_meta.name AS name,
                        udo_meta.id AS udoId
                        FROM UdoMeta udo_meta
                        JOIN UdfMeta udf_meta
                        ON udf_meta.id IN udo_meta.udfMetas
                        WHERE udo_meta.name = '${udoMetaName}'`
            })
        });

        if (!response.ok) {
            throw new Error(`🚀🚀🚀 Failed to fetch UdfMeta, got status ${response.status} `);
        }

        return (await response.json()).data;
    }

    /**
     * @param {string[]} [fieldNames]
     * @returns {Promise<{ id: string, name: string, description: string }[]>}
    */
    async function fetchUdfMetaByFieldName(fieldNames) {
        const response = await fetch(
            'https://eu.fsm.cloud.sap/api/query/v1?' + new URLSearchParams({
                ...await common.getSearchParams(),
                dtos: 'UdfMeta.19',
            }), {
            method: 'POST',
            headers: await common.getHeaders(),
            body: JSON.stringify({
                query:
                    `SELECT
                        udf_meta.id AS id,
                        udf_meta.description AS description,
                        udf_meta.name AS name
                    FROM UdfMeta udf_meta
                    WHERE udf_meta.name IN ('${fieldNames.join('\',\'')}')`
            })
        });

        if (!response.ok) {
            throw new Error(`🚀🚀🚀 Failed to fetch UdfMeta, got status ${response.status}`);
        }

        return (await response.json()).data;
    }

    return {
        setShellSdk,
        getShellSdk,
        getContext,
        getHeaders,
        getSearchParams,
        fetchUdfMeta,
        fetchUdfMetaByFieldName
    }

})();