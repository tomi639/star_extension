/**
 * Rename this file accordong to your needs..
 * this file should contain the main logic of the extension
 * 
 * 
 * 
 * 
 */

const my_extension = (() => {

    async function testMyExtension() {
        const context = await common.getContext();

        utils.setFieldValue('#info', `User: ${context.user} :: ${context.account} :: ${context.company}`);
    }

    return {
        testMyExtension
    }



}) ();