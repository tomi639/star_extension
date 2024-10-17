/**
 * some sample util functions...
 */

const utils = (() => {
    /**
     * 
     * @param {string} id: DOM elements id 
     * @param {string} value: value of the selected element  
     */
    function setFieldValue(id, value) {
        getDomElement(id).textContent = value;
    }
    /**
     * 
     * @param {string} id: DOM elements id 
     */
    function getDomElement(id) {
        return document.querySelector(id); 
    }

    return {
        setFieldValue
    }
 })();