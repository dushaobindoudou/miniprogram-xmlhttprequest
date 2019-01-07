/*
 * File: index.js
 * Project: miniprogram-xmlhttprequest
 * File Created: 2019-01-04 12:51:27 pm
 * Author: dushaobin (dushaobindoudou@gmail.com)
 * -----
 * Last Modified: 2019-01-04 12:51:46 pm
 * Modified By: dushaobin (dushaobindoudou@gmail.com)
 * -----
 * Copyright (c) dushaobin 2019
 */

const SUPPORT_METHOD = ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'CONNECT'];
const STATUS_TEXT_MAP = {
    100: 'Continue',
    101: 'Switching protocols',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Requested Range Not Suitable',
    417: 'Expectation Failed',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
};

const urlParse = require('url-parse');

class XMLHttpRequest {
    constructor() {
        this._method = '';
        this._url = '';
        this._data = null;
        this._status = 0;
        this._statusText = '';
        this._isAsync = true;
        this._readyState = XMLHttpRequest.UNINITIALIZED;
        this._onreadystatechange = null;
        this._header = {
            'User-Agent': 'miniprogram-xmlhttprequest',
            Accept: '*/*',
        };
        this._responseType = '';
        this._resHeader = null;
        this._response = null;
        this._responseXML = null;
        this._timeout = 0;
        this._startTime = null;
        this._requestTask = null;
        this._requestSuccess = this._requestSuccess.bind(this);
        this._requestFail = this._requestFail.bind(this);
        this._requestComplete = this._requestComplete.bind(this);
    }

    _callReadyStateChange(readyState) {
        const func = this._onreadystatechange;
        const hasChange = readyState !== this._readyState;
        if (hasChange) {
            this._readyState = readyState;
            if (typeof func === 'function') {
                func.call(null);
            }
        }
    }

    _callRequest() {
        this._status = 0;
        this._statusText = '';
        this._readyState = XMLHttpRequest.OPEN;
        this._resHeader = null;
        this._response = null;
        const header = Object.assign({}, this._header);

        // eslint-disable-next-line no-undef
        this._requestTask = wx.request({
            url: this._url,
            data: this._data,
            header,
            method: this._method,
            dataType: this._responseType === 'json' ? 'json' : 'text',
            responseType: this._responseType === 'arraybuffer' ? 'arraybuffer' : 'text',
            success: this._requestSuccess,
            fail: this._requestFail,
            complete: this._requestComplete,
        });

        this._requestTask.onHeadersReceived(() => {
            this._callReadyStateChange(XMLHttpRequest.RECEIVING);
        });
    }

    _requestSuccess({ data, statusCode, header }) {
        this._status = statusCode;
        this._statusText = STATUS_TEXT_MAP[statusCode];
        this._resHeader = header;
        this._response = data;
        this._callReadyStateChange(XMLHttpRequest.LOADED);
    }

    _requestFail({ errMsg }) {
        this._status = 0;
        this._statusText = errMsg;
    }

    _requestComplete() {
        this._startTime = null;
        this._requestTask = null;
    }

    get timeout() {
        return this._timeout;
    }

    set timeout(timeout) {
        // eslint-disable-next-line no-restricted-globals
        if (typeof timeout !== 'number' || !isFinite(timeout) || timeout <= 0) {
            return;
        }
        this._timeout = timeout;
    }

    get status() {
        return this._status;
    }

    get statusText() {
        if (this._readyState === XMLHttpRequest.UNINITIALIZED
            || this._readyState === XMLHttpRequest.OPEN) {
            return '';
        }
        return STATUS_TEXT_MAP[`${this._status}`] || this._statusText || '';
    }

    get readyState() {
        return this._readyState;
    }

    get onreadystatechange() {
        return this._onreadystatechange;
    }

    set onreadystatechange(func) {
        if (typeof func === 'function') {
            this._onreadystatechange = func;
        }
    }

    get responseType() {
        return this._responseType;
    }

    set responseType(value) {
        if (typeof value !== 'string') {
            return;
        }
        this._responseType = value;
    }

    get responseText() {
        if (!this._responseType || this._responseType === 'text') {
            return this._response;
        }
        return null;
    }

    get responseXML() {
        return this._responseXML;
    }

    get response() {
        return this._response;
    }

    abort() {
        if (this._requestTask) {
            this._requestTask.abort();
            this._requestTask = null;
        }
        this._readyState = XMLHttpRequest.UNINITIALIZED;
        this._status = 0;
        this._statusText = '';
        this._response = '';
        this._responseXML = '';
    }

    getAllResponseHeaders() {
        if (this._readyState === XMLHttpRequest.UNINITIALIZED
            || this._readyState === XMLHttpRequest.OPEN || !this._resHeader) {
            return null;
        }

        return Object.keys(this._resHeader)
            .map(key => `${key}: ${this._resHeader[key]}`)
            .join('\r\n');
    }

    getResponseHeader(name) {
        if (this._readyState === XMLHttpRequest.UNINITIALIZED
            || this._readyState === XMLHttpRequest.OPEN || !this._resHeader) {
            return null;
        }
        const value = this._resHeader[name];
        return typeof value === 'string' ? value : null;
    }

    getRequestHeader(name) {
        if (typeof name === 'string' && this._header[name]) {
            return this._header[name];
        }
        return '';
    }

    // eslint-disable-next-line no-unused-vars
    open(method, url, async, username, password) {
        // 发送请求前先要取消当前请求
        this.abort();
        let httpMethod = 'GET';
        if (typeof method === 'string') {
            httpMethod = method.toUpperCase();
        }

        if (!SUPPORT_METHOD.includes(httpMethod) || !url || typeof url !== 'string') {
            return;
        }

        const urlObj = urlParse(url, true);
        if (typeof username === 'string') {
            urlObj.set('username', username);
        }

        if (typeof password === 'string') {
            urlObj.set('password', password);
        }

        this._method = httpMethod;
        this._url = urlObj.toString();
        this._isAsync = typeof async === 'boolean' ? async : true;
        this._callReadyStateChange(XMLHttpRequest.OPEN);
    }

    setRequestHeader(header, value) {
        if (this._readyState === XMLHttpRequest.OPEN) {
            if (typeof header === 'string' && typeof value === 'string') {
                this._header[header] = value;
            }
        } else {
            throw new Error('INVALID_STATE_ERR: setRequestHeader can only be called when state is OPEN');
        }
    }

    send(data) {
        if (this._readyState !== XMLHttpRequest.OPEN) {
            return;
        }
        this._data = data;
        this._callRequest();
    }
}

XMLHttpRequest.UNINITIALIZED = 0;
XMLHttpRequest.OPEN = 1;
XMLHttpRequest.SEND = 2;
XMLHttpRequest.RECEIVING = 3;
XMLHttpRequest.LOADED = 4;

module.exports = XMLHttpRequest;
