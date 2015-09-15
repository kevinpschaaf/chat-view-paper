window.WebComponents = window.WebComponents || {};
(function (scope) {
var flags = scope.flags || {};
var file = 'webcomponents-lite.js';
var script = document.querySelector('script[src*="' + file + '"]');
if (!flags.noOpts) {
location.search.slice(1).split('&').forEach(function (option) {
var parts = option.split('=');
var match;
if (parts[0] && (match = parts[0].match(/wc-(.+)/))) {
flags[match[1]] = parts[1] || true;
}
});
if (script) {
for (var i = 0, a; a = script.attributes[i]; i++) {
if (a.name !== 'src') {
flags[a.name] = a.value || true;
}
}
}
if (flags.log) {
var parts = flags.log.split(',');
flags.log = {};
parts.forEach(function (f) {
flags.log[f] = true;
});
} else {
flags.log = {};
}
}
flags.shadow = flags.shadow || flags.shadowdom || flags.polyfill;
if (flags.shadow === 'native') {
flags.shadow = false;
} else {
flags.shadow = flags.shadow || !HTMLElement.prototype.createShadowRoot;
}
if (flags.register) {
window.CustomElements = window.CustomElements || { flags: {} };
window.CustomElements.flags.register = flags.register;
}
scope.flags = flags;
}(window.WebComponents));
(function (scope) {
'use strict';
var hasWorkingUrl = false;
if (!scope.forceJURL) {
try {
var u = new URL('b', 'http://a');
u.pathname = 'c%20d';
hasWorkingUrl = u.href === 'http://a/c%20d';
} catch (e) {
}
}
if (hasWorkingUrl)
return;
var relative = Object.create(null);
relative['ftp'] = 21;
relative['file'] = 0;
relative['gopher'] = 70;
relative['http'] = 80;
relative['https'] = 443;
relative['ws'] = 80;
relative['wss'] = 443;
var relativePathDotMapping = Object.create(null);
relativePathDotMapping['%2e'] = '.';
relativePathDotMapping['.%2e'] = '..';
relativePathDotMapping['%2e.'] = '..';
relativePathDotMapping['%2e%2e'] = '..';
function isRelativeScheme(scheme) {
return relative[scheme] !== undefined;
}
function invalid() {
clear.call(this);
this._isInvalid = true;
}
function IDNAToASCII(h) {
if ('' == h) {
invalid.call(this);
}
return h.toLowerCase();
}
function percentEscape(c) {
var unicode = c.charCodeAt(0);
if (unicode > 32 && unicode < 127 && [
34,
35,
60,
62,
63,
96
].indexOf(unicode) == -1) {
return c;
}
return encodeURIComponent(c);
}
function percentEscapeQuery(c) {
var unicode = c.charCodeAt(0);
if (unicode > 32 && unicode < 127 && [
34,
35,
60,
62,
96
].indexOf(unicode) == -1) {
return c;
}
return encodeURIComponent(c);
}
var EOF = undefined, ALPHA = /[a-zA-Z]/, ALPHANUMERIC = /[a-zA-Z0-9\+\-\.]/;
function parse(input, stateOverride, base) {
function err(message) {
errors.push(message);
}
var state = stateOverride || 'scheme start', cursor = 0, buffer = '', seenAt = false, seenBracket = false, errors = [];
loop:
while ((input[cursor - 1] != EOF || cursor == 0) && !this._isInvalid) {
var c = input[cursor];
switch (state) {
case 'scheme start':
if (c && ALPHA.test(c)) {
buffer += c.toLowerCase();
state = 'scheme';
} else if (!stateOverride) {
buffer = '';
state = 'no scheme';
continue;
} else {
err('Invalid scheme.');
break loop;
}
break;
case 'scheme':
if (c && ALPHANUMERIC.test(c)) {
buffer += c.toLowerCase();
} else if (':' == c) {
this._scheme = buffer;
buffer = '';
if (stateOverride) {
break loop;
}
if (isRelativeScheme(this._scheme)) {
this._isRelative = true;
}
if ('file' == this._scheme) {
state = 'relative';
} else if (this._isRelative && base && base._scheme == this._scheme) {
state = 'relative or authority';
} else if (this._isRelative) {
state = 'authority first slash';
} else {
state = 'scheme data';
}
} else if (!stateOverride) {
buffer = '';
cursor = 0;
state = 'no scheme';
continue;
} else if (EOF == c) {
break loop;
} else {
err('Code point not allowed in scheme: ' + c);
break loop;
}
break;
case 'scheme data':
if ('?' == c) {
this._query = '?';
state = 'query';
} else if ('#' == c) {
this._fragment = '#';
state = 'fragment';
} else {
if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._schemeData += percentEscape(c);
}
}
break;
case 'no scheme':
if (!base || !isRelativeScheme(base._scheme)) {
err('Missing scheme.');
invalid.call(this);
} else {
state = 'relative';
continue;
}
break;
case 'relative or authority':
if ('/' == c && '/' == input[cursor + 1]) {
state = 'authority ignore slashes';
} else {
err('Expected /, got: ' + c);
state = 'relative';
continue;
}
break;
case 'relative':
this._isRelative = true;
if ('file' != this._scheme)
this._scheme = base._scheme;
if (EOF == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = base._query;
this._username = base._username;
this._password = base._password;
break loop;
} else if ('/' == c || '\\' == c) {
if ('\\' == c)
err('\\ is an invalid code point.');
state = 'relative slash';
} else if ('?' == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = '?';
this._username = base._username;
this._password = base._password;
state = 'query';
} else if ('#' == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = base._query;
this._fragment = '#';
this._username = base._username;
this._password = base._password;
state = 'fragment';
} else {
var nextC = input[cursor + 1];
var nextNextC = input[cursor + 2];
if ('file' != this._scheme || !ALPHA.test(c) || nextC != ':' && nextC != '|' || EOF != nextNextC && '/' != nextNextC && '\\' != nextNextC && '?' != nextNextC && '#' != nextNextC) {
this._host = base._host;
this._port = base._port;
this._username = base._username;
this._password = base._password;
this._path = base._path.slice();
this._path.pop();
}
state = 'relative path';
continue;
}
break;
case 'relative slash':
if ('/' == c || '\\' == c) {
if ('\\' == c) {
err('\\ is an invalid code point.');
}
if ('file' == this._scheme) {
state = 'file host';
} else {
state = 'authority ignore slashes';
}
} else {
if ('file' != this._scheme) {
this._host = base._host;
this._port = base._port;
this._username = base._username;
this._password = base._password;
}
state = 'relative path';
continue;
}
break;
case 'authority first slash':
if ('/' == c) {
state = 'authority second slash';
} else {
err('Expected \'/\', got: ' + c);
state = 'authority ignore slashes';
continue;
}
break;
case 'authority second slash':
state = 'authority ignore slashes';
if ('/' != c) {
err('Expected \'/\', got: ' + c);
continue;
}
break;
case 'authority ignore slashes':
if ('/' != c && '\\' != c) {
state = 'authority';
continue;
} else {
err('Expected authority, got: ' + c);
}
break;
case 'authority':
if ('@' == c) {
if (seenAt) {
err('@ already seen.');
buffer += '%40';
}
seenAt = true;
for (var i = 0; i < buffer.length; i++) {
var cp = buffer[i];
if ('\t' == cp || '\n' == cp || '\r' == cp) {
err('Invalid whitespace in authority.');
continue;
}
if (':' == cp && null === this._password) {
this._password = '';
continue;
}
var tempC = percentEscape(cp);
null !== this._password ? this._password += tempC : this._username += tempC;
}
buffer = '';
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
cursor -= buffer.length;
buffer = '';
state = 'host';
continue;
} else {
buffer += c;
}
break;
case 'file host':
if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
if (buffer.length == 2 && ALPHA.test(buffer[0]) && (buffer[1] == ':' || buffer[1] == '|')) {
state = 'relative path';
} else if (buffer.length == 0) {
state = 'relative path start';
} else {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'relative path start';
}
continue;
} else if ('\t' == c || '\n' == c || '\r' == c) {
err('Invalid whitespace in file host.');
} else {
buffer += c;
}
break;
case 'host':
case 'hostname':
if (':' == c && !seenBracket) {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'port';
if ('hostname' == stateOverride) {
break loop;
}
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'relative path start';
if (stateOverride) {
break loop;
}
continue;
} else if ('\t' != c && '\n' != c && '\r' != c) {
if ('[' == c) {
seenBracket = true;
} else if (']' == c) {
seenBracket = false;
}
buffer += c;
} else {
err('Invalid code point in host/hostname: ' + c);
}
break;
case 'port':
if (/[0-9]/.test(c)) {
buffer += c;
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c || stateOverride) {
if ('' != buffer) {
var temp = parseInt(buffer, 10);
if (temp != relative[this._scheme]) {
this._port = temp + '';
}
buffer = '';
}
if (stateOverride) {
break loop;
}
state = 'relative path start';
continue;
} else if ('\t' == c || '\n' == c || '\r' == c) {
err('Invalid code point in port: ' + c);
} else {
invalid.call(this);
}
break;
case 'relative path start':
if ('\\' == c)
err('\'\\\' not allowed in path.');
state = 'relative path';
if ('/' != c && '\\' != c) {
continue;
}
break;
case 'relative path':
if (EOF == c || '/' == c || '\\' == c || !stateOverride && ('?' == c || '#' == c)) {
if ('\\' == c) {
err('\\ not allowed in relative path.');
}
var tmp;
if (tmp = relativePathDotMapping[buffer.toLowerCase()]) {
buffer = tmp;
}
if ('..' == buffer) {
this._path.pop();
if ('/' != c && '\\' != c) {
this._path.push('');
}
} else if ('.' == buffer && '/' != c && '\\' != c) {
this._path.push('');
} else if ('.' != buffer) {
if ('file' == this._scheme && this._path.length == 0 && buffer.length == 2 && ALPHA.test(buffer[0]) && buffer[1] == '|') {
buffer = buffer[0] + ':';
}
this._path.push(buffer);
}
buffer = '';
if ('?' == c) {
this._query = '?';
state = 'query';
} else if ('#' == c) {
this._fragment = '#';
state = 'fragment';
}
} else if ('\t' != c && '\n' != c && '\r' != c) {
buffer += percentEscape(c);
}
break;
case 'query':
if (!stateOverride && '#' == c) {
this._fragment = '#';
state = 'fragment';
} else if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._query += percentEscapeQuery(c);
}
break;
case 'fragment':
if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._fragment += c;
}
break;
}
cursor++;
}
}
function clear() {
this._scheme = '';
this._schemeData = '';
this._username = '';
this._password = null;
this._host = '';
this._port = '';
this._path = [];
this._query = '';
this._fragment = '';
this._isInvalid = false;
this._isRelative = false;
}
function jURL(url, base) {
if (base !== undefined && !(base instanceof jURL))
base = new jURL(String(base));
this._url = url;
clear.call(this);
var input = url.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, '');
parse.call(this, input, null, base);
}
jURL.prototype = {
toString: function () {
return this.href;
},
get href() {
if (this._isInvalid)
return this._url;
var authority = '';
if ('' != this._username || null != this._password) {
authority = this._username + (null != this._password ? ':' + this._password : '') + '@';
}
return this.protocol + (this._isRelative ? '//' + authority + this.host : '') + this.pathname + this._query + this._fragment;
},
set href(href) {
clear.call(this);
parse.call(this, href);
},
get protocol() {
return this._scheme + ':';
},
set protocol(protocol) {
if (this._isInvalid)
return;
parse.call(this, protocol + ':', 'scheme start');
},
get host() {
return this._isInvalid ? '' : this._port ? this._host + ':' + this._port : this._host;
},
set host(host) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, host, 'host');
},
get hostname() {
return this._host;
},
set hostname(hostname) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, hostname, 'hostname');
},
get port() {
return this._port;
},
set port(port) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, port, 'port');
},
get pathname() {
return this._isInvalid ? '' : this._isRelative ? '/' + this._path.join('/') : this._schemeData;
},
set pathname(pathname) {
if (this._isInvalid || !this._isRelative)
return;
this._path = [];
parse.call(this, pathname, 'relative path start');
},
get search() {
return this._isInvalid || !this._query || '?' == this._query ? '' : this._query;
},
set search(search) {
if (this._isInvalid || !this._isRelative)
return;
this._query = '?';
if ('?' == search[0])
search = search.slice(1);
parse.call(this, search, 'query');
},
get hash() {
return this._isInvalid || !this._fragment || '#' == this._fragment ? '' : this._fragment;
},
set hash(hash) {
if (this._isInvalid)
return;
this._fragment = '#';
if ('#' == hash[0])
hash = hash.slice(1);
parse.call(this, hash, 'fragment');
},
get origin() {
var host;
if (this._isInvalid || !this._scheme) {
return '';
}
switch (this._scheme) {
case 'data':
case 'file':
case 'javascript':
case 'mailto':
return 'null';
}
host = this.host;
if (!host) {
return '';
}
return this._scheme + '://' + host;
}
};
var OriginalURL = scope.URL;
if (OriginalURL) {
jURL.createObjectURL = function (blob) {
return OriginalURL.createObjectURL.apply(OriginalURL, arguments);
};
jURL.revokeObjectURL = function (url) {
OriginalURL.revokeObjectURL(url);
};
}
scope.URL = jURL;
}(this));
if (typeof WeakMap === 'undefined') {
(function () {
var defineProperty = Object.defineProperty;
var counter = Date.now() % 1000000000;
var WeakMap = function () {
this.name = '__st' + (Math.random() * 1000000000 >>> 0) + (counter++ + '__');
};
WeakMap.prototype = {
set: function (key, value) {
var entry = key[this.name];
if (entry && entry[0] === key)
entry[1] = value;
else
defineProperty(key, this.name, {
value: [
key,
value
],
writable: true
});
return this;
},
get: function (key) {
var entry;
return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
},
'delete': function (key) {
var entry = key[this.name];
if (!entry || entry[0] !== key)
return false;
entry[0] = entry[1] = undefined;
return true;
},
has: function (key) {
var entry = key[this.name];
if (!entry)
return false;
return entry[0] === key;
}
};
window.WeakMap = WeakMap;
}());
}
(function (global) {
var registrationsTable = new WeakMap();
var setImmediate;
if (/Trident|Edge/.test(navigator.userAgent)) {
setImmediate = setTimeout;
} else if (window.setImmediate) {
setImmediate = window.setImmediate;
} else {
var setImmediateQueue = [];
var sentinel = String(Math.random());
window.addEventListener('message', function (e) {
if (e.data === sentinel) {
var queue = setImmediateQueue;
setImmediateQueue = [];
queue.forEach(function (func) {
func();
});
}
});
setImmediate = function (func) {
setImmediateQueue.push(func);
window.postMessage(sentinel, '*');
};
}
var isScheduled = false;
var scheduledObservers = [];
function scheduleCallback(observer) {
scheduledObservers.push(observer);
if (!isScheduled) {
isScheduled = true;
setImmediate(dispatchCallbacks);
}
}
function wrapIfNeeded(node) {
return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
}
function dispatchCallbacks() {
isScheduled = false;
var observers = scheduledObservers;
scheduledObservers = [];
observers.sort(function (o1, o2) {
return o1.uid_ - o2.uid_;
});
var anyNonEmpty = false;
observers.forEach(function (observer) {
var queue = observer.takeRecords();
removeTransientObserversFor(observer);
if (queue.length) {
observer.callback_(queue, observer);
anyNonEmpty = true;
}
});
if (anyNonEmpty)
dispatchCallbacks();
}
function removeTransientObserversFor(observer) {
observer.nodes_.forEach(function (node) {
var registrations = registrationsTable.get(node);
if (!registrations)
return;
registrations.forEach(function (registration) {
if (registration.observer === observer)
registration.removeTransientObservers();
});
});
}
function forEachAncestorAndObserverEnqueueRecord(target, callback) {
for (var node = target; node; node = node.parentNode) {
var registrations = registrationsTable.get(node);
if (registrations) {
for (var j = 0; j < registrations.length; j++) {
var registration = registrations[j];
var options = registration.options;
if (node !== target && !options.subtree)
continue;
var record = callback(options);
if (record)
registration.enqueue(record);
}
}
}
}
var uidCounter = 0;
function JsMutationObserver(callback) {
this.callback_ = callback;
this.nodes_ = [];
this.records_ = [];
this.uid_ = ++uidCounter;
}
JsMutationObserver.prototype = {
observe: function (target, options) {
target = wrapIfNeeded(target);
if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
throw new SyntaxError();
}
var registrations = registrationsTable.get(target);
if (!registrations)
registrationsTable.set(target, registrations = []);
var registration;
for (var i = 0; i < registrations.length; i++) {
if (registrations[i].observer === this) {
registration = registrations[i];
registration.removeListeners();
registration.options = options;
break;
}
}
if (!registration) {
registration = new Registration(this, target, options);
registrations.push(registration);
this.nodes_.push(target);
}
registration.addListeners();
},
disconnect: function () {
this.nodes_.forEach(function (node) {
var registrations = registrationsTable.get(node);
for (var i = 0; i < registrations.length; i++) {
var registration = registrations[i];
if (registration.observer === this) {
registration.removeListeners();
registrations.splice(i, 1);
break;
}
}
}, this);
this.records_ = [];
},
takeRecords: function () {
var copyOfRecords = this.records_;
this.records_ = [];
return copyOfRecords;
}
};
function MutationRecord(type, target) {
this.type = type;
this.target = target;
this.addedNodes = [];
this.removedNodes = [];
this.previousSibling = null;
this.nextSibling = null;
this.attributeName = null;
this.attributeNamespace = null;
this.oldValue = null;
}
function copyMutationRecord(original) {
var record = new MutationRecord(original.type, original.target);
record.addedNodes = original.addedNodes.slice();
record.removedNodes = original.removedNodes.slice();
record.previousSibling = original.previousSibling;
record.nextSibling = original.nextSibling;
record.attributeName = original.attributeName;
record.attributeNamespace = original.attributeNamespace;
record.oldValue = original.oldValue;
return record;
}
var currentRecord, recordWithOldValue;
function getRecord(type, target) {
return currentRecord = new MutationRecord(type, target);
}
function getRecordWithOldValue(oldValue) {
if (recordWithOldValue)
return recordWithOldValue;
recordWithOldValue = copyMutationRecord(currentRecord);
recordWithOldValue.oldValue = oldValue;
return recordWithOldValue;
}
function clearRecords() {
currentRecord = recordWithOldValue = undefined;
}
function recordRepresentsCurrentMutation(record) {
return record === recordWithOldValue || record === currentRecord;
}
function selectRecord(lastRecord, newRecord) {
if (lastRecord === newRecord)
return lastRecord;
if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord))
return recordWithOldValue;
return null;
}
function Registration(observer, target, options) {
this.observer = observer;
this.target = target;
this.options = options;
this.transientObservedNodes = [];
}
Registration.prototype = {
enqueue: function (record) {
var records = this.observer.records_;
var length = records.length;
if (records.length > 0) {
var lastRecord = records[length - 1];
var recordToReplaceLast = selectRecord(lastRecord, record);
if (recordToReplaceLast) {
records[length - 1] = recordToReplaceLast;
return;
}
} else {
scheduleCallback(this.observer);
}
records[length] = record;
},
addListeners: function () {
this.addListeners_(this.target);
},
addListeners_: function (node) {
var options = this.options;
if (options.attributes)
node.addEventListener('DOMAttrModified', this, true);
if (options.characterData)
node.addEventListener('DOMCharacterDataModified', this, true);
if (options.childList)
node.addEventListener('DOMNodeInserted', this, true);
if (options.childList || options.subtree)
node.addEventListener('DOMNodeRemoved', this, true);
},
removeListeners: function () {
this.removeListeners_(this.target);
},
removeListeners_: function (node) {
var options = this.options;
if (options.attributes)
node.removeEventListener('DOMAttrModified', this, true);
if (options.characterData)
node.removeEventListener('DOMCharacterDataModified', this, true);
if (options.childList)
node.removeEventListener('DOMNodeInserted', this, true);
if (options.childList || options.subtree)
node.removeEventListener('DOMNodeRemoved', this, true);
},
addTransientObserver: function (node) {
if (node === this.target)
return;
this.addListeners_(node);
this.transientObservedNodes.push(node);
var registrations = registrationsTable.get(node);
if (!registrations)
registrationsTable.set(node, registrations = []);
registrations.push(this);
},
removeTransientObservers: function () {
var transientObservedNodes = this.transientObservedNodes;
this.transientObservedNodes = [];
transientObservedNodes.forEach(function (node) {
this.removeListeners_(node);
var registrations = registrationsTable.get(node);
for (var i = 0; i < registrations.length; i++) {
if (registrations[i] === this) {
registrations.splice(i, 1);
break;
}
}
}, this);
},
handleEvent: function (e) {
e.stopImmediatePropagation();
switch (e.type) {
case 'DOMAttrModified':
var name = e.attrName;
var namespace = e.relatedNode.namespaceURI;
var target = e.target;
var record = new getRecord('attributes', target);
record.attributeName = name;
record.attributeNamespace = namespace;
var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
forEachAncestorAndObserverEnqueueRecord(target, function (options) {
if (!options.attributes)
return;
if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
return;
}
if (options.attributeOldValue)
return getRecordWithOldValue(oldValue);
return record;
});
break;
case 'DOMCharacterDataModified':
var target = e.target;
var record = getRecord('characterData', target);
var oldValue = e.prevValue;
forEachAncestorAndObserverEnqueueRecord(target, function (options) {
if (!options.characterData)
return;
if (options.characterDataOldValue)
return getRecordWithOldValue(oldValue);
return record;
});
break;
case 'DOMNodeRemoved':
this.addTransientObserver(e.target);
case 'DOMNodeInserted':
var changedNode = e.target;
var addedNodes, removedNodes;
if (e.type === 'DOMNodeInserted') {
addedNodes = [changedNode];
removedNodes = [];
} else {
addedNodes = [];
removedNodes = [changedNode];
}
var previousSibling = changedNode.previousSibling;
var nextSibling = changedNode.nextSibling;
var record = getRecord('childList', e.target.parentNode);
record.addedNodes = addedNodes;
record.removedNodes = removedNodes;
record.previousSibling = previousSibling;
record.nextSibling = nextSibling;
forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function (options) {
if (!options.childList)
return;
return record;
});
}
clearRecords();
}
};
global.JsMutationObserver = JsMutationObserver;
if (!global.MutationObserver)
global.MutationObserver = JsMutationObserver;
}(window));
window.HTMLImports = window.HTMLImports || { flags: {} };
(function (scope) {
var IMPORT_LINK_TYPE = 'import';
var useNative = Boolean(IMPORT_LINK_TYPE in document.createElement('link'));
var hasShadowDOMPolyfill = Boolean(window.ShadowDOMPolyfill);
var wrap = function (node) {
return hasShadowDOMPolyfill ? window.ShadowDOMPolyfill.wrapIfNeeded(node) : node;
};
var rootDocument = wrap(document);
var currentScriptDescriptor = {
get: function () {
var script = window.HTMLImports.currentScript || document.currentScript || (document.readyState !== 'complete' ? document.scripts[document.scripts.length - 1] : null);
return wrap(script);
},
configurable: true
};
Object.defineProperty(document, '_currentScript', currentScriptDescriptor);
Object.defineProperty(rootDocument, '_currentScript', currentScriptDescriptor);
var isIE = /Trident/.test(navigator.userAgent);
function whenReady(callback, doc) {
doc = doc || rootDocument;
whenDocumentReady(function () {
watchImportsLoad(callback, doc);
}, doc);
}
var requiredReadyState = isIE ? 'complete' : 'interactive';
var READY_EVENT = 'readystatechange';
function isDocumentReady(doc) {
return doc.readyState === 'complete' || doc.readyState === requiredReadyState;
}
function whenDocumentReady(callback, doc) {
if (!isDocumentReady(doc)) {
var checkReady = function () {
if (doc.readyState === 'complete' || doc.readyState === requiredReadyState) {
doc.removeEventListener(READY_EVENT, checkReady);
whenDocumentReady(callback, doc);
}
};
doc.addEventListener(READY_EVENT, checkReady);
} else if (callback) {
callback();
}
}
function markTargetLoaded(event) {
event.target.__loaded = true;
}
function watchImportsLoad(callback, doc) {
var imports = doc.querySelectorAll('link[rel=import]');
var parsedCount = 0, importCount = imports.length, newImports = [], errorImports = [];
function checkDone() {
if (parsedCount == importCount && callback) {
callback({
allImports: imports,
loadedImports: newImports,
errorImports: errorImports
});
}
}
function loadedImport(e) {
markTargetLoaded(e);
newImports.push(this);
parsedCount++;
checkDone();
}
function errorLoadingImport(e) {
errorImports.push(this);
parsedCount++;
checkDone();
}
if (importCount) {
for (var i = 0, imp; i < importCount && (imp = imports[i]); i++) {
if (isImportLoaded(imp)) {
parsedCount++;
checkDone();
} else {
imp.addEventListener('load', loadedImport);
imp.addEventListener('error', errorLoadingImport);
}
}
} else {
checkDone();
}
}
function isImportLoaded(link) {
return useNative ? link.__loaded || link.import && link.import.readyState !== 'loading' : link.__importParsed;
}
if (useNative) {
new MutationObserver(function (mxns) {
for (var i = 0, l = mxns.length, m; i < l && (m = mxns[i]); i++) {
if (m.addedNodes) {
handleImports(m.addedNodes);
}
}
}).observe(document.head, { childList: true });
function handleImports(nodes) {
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (isImport(n)) {
handleImport(n);
}
}
}
function isImport(element) {
return element.localName === 'link' && element.rel === 'import';
}
function handleImport(element) {
var loaded = element.import;
if (loaded) {
markTargetLoaded({ target: element });
} else {
element.addEventListener('load', markTargetLoaded);
element.addEventListener('error', markTargetLoaded);
}
}
(function () {
if (document.readyState === 'loading') {
var imports = document.querySelectorAll('link[rel=import]');
for (var i = 0, l = imports.length, imp; i < l && (imp = imports[i]); i++) {
handleImport(imp);
}
}
}());
}
whenReady(function (detail) {
window.HTMLImports.ready = true;
window.HTMLImports.readyTime = new Date().getTime();
var evt = rootDocument.createEvent('CustomEvent');
evt.initCustomEvent('HTMLImportsLoaded', true, true, detail);
rootDocument.dispatchEvent(evt);
});
scope.IMPORT_LINK_TYPE = IMPORT_LINK_TYPE;
scope.useNative = useNative;
scope.rootDocument = rootDocument;
scope.whenReady = whenReady;
scope.isIE = isIE;
}(window.HTMLImports));
(function (scope) {
var modules = [];
var addModule = function (module) {
modules.push(module);
};
var initializeModules = function () {
modules.forEach(function (module) {
module(scope);
});
};
scope.addModule = addModule;
scope.initializeModules = initializeModules;
}(window.HTMLImports));
window.HTMLImports.addModule(function (scope) {
var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;
var path = {
resolveUrlsInStyle: function (style, linkUrl) {
var doc = style.ownerDocument;
var resolver = doc.createElement('a');
style.textContent = this.resolveUrlsInCssText(style.textContent, linkUrl, resolver);
return style;
},
resolveUrlsInCssText: function (cssText, linkUrl, urlObj) {
var r = this.replaceUrls(cssText, urlObj, linkUrl, CSS_URL_REGEXP);
r = this.replaceUrls(r, urlObj, linkUrl, CSS_IMPORT_REGEXP);
return r;
},
replaceUrls: function (text, urlObj, linkUrl, regexp) {
return text.replace(regexp, function (m, pre, url, post) {
var urlPath = url.replace(/["']/g, '');
if (linkUrl) {
urlPath = new URL(urlPath, linkUrl).href;
}
urlObj.href = urlPath;
urlPath = urlObj.href;
return pre + '\'' + urlPath + '\'' + post;
});
}
};
scope.path = path;
});
window.HTMLImports.addModule(function (scope) {
var xhr = {
async: true,
ok: function (request) {
return request.status >= 200 && request.status < 300 || request.status === 304 || request.status === 0;
},
load: function (url, next, nextContext) {
var request = new XMLHttpRequest();
if (scope.flags.debug || scope.flags.bust) {
url += '?' + Math.random();
}
request.open('GET', url, xhr.async);
request.addEventListener('readystatechange', function (e) {
if (request.readyState === 4) {
var locationHeader = request.getResponseHeader('Location');
var redirectedUrl = null;
if (locationHeader) {
var redirectedUrl = locationHeader.substr(0, 1) === '/' ? location.origin + locationHeader : locationHeader;
}
next.call(nextContext, !xhr.ok(request) && request, request.response || request.responseText, redirectedUrl);
}
});
request.send();
return request;
},
loadDocument: function (url, next, nextContext) {
this.load(url, next, nextContext).responseType = 'document';
}
};
scope.xhr = xhr;
});
window.HTMLImports.addModule(function (scope) {
var xhr = scope.xhr;
var flags = scope.flags;
var Loader = function (onLoad, onComplete) {
this.cache = {};
this.onload = onLoad;
this.oncomplete = onComplete;
this.inflight = 0;
this.pending = {};
};
Loader.prototype = {
addNodes: function (nodes) {
this.inflight += nodes.length;
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
this.require(n);
}
this.checkDone();
},
addNode: function (node) {
this.inflight++;
this.require(node);
this.checkDone();
},
require: function (elt) {
var url = elt.src || elt.href;
elt.__nodeUrl = url;
if (!this.dedupe(url, elt)) {
this.fetch(url, elt);
}
},
dedupe: function (url, elt) {
if (this.pending[url]) {
this.pending[url].push(elt);
return true;
}
var resource;
if (this.cache[url]) {
this.onload(url, elt, this.cache[url]);
this.tail();
return true;
}
this.pending[url] = [elt];
return false;
},
fetch: function (url, elt) {
flags.load && console.log('fetch', url, elt);
if (!url) {
setTimeout(function () {
this.receive(url, elt, { error: 'href must be specified' }, null);
}.bind(this), 0);
} else if (url.match(/^data:/)) {
var pieces = url.split(',');
var header = pieces[0];
var body = pieces[1];
if (header.indexOf(';base64') > -1) {
body = atob(body);
} else {
body = decodeURIComponent(body);
}
setTimeout(function () {
this.receive(url, elt, null, body);
}.bind(this), 0);
} else {
var receiveXhr = function (err, resource, redirectedUrl) {
this.receive(url, elt, err, resource, redirectedUrl);
}.bind(this);
xhr.load(url, receiveXhr);
}
},
receive: function (url, elt, err, resource, redirectedUrl) {
this.cache[url] = resource;
var $p = this.pending[url];
for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
this.onload(url, p, resource, err, redirectedUrl);
this.tail();
}
this.pending[url] = null;
},
tail: function () {
--this.inflight;
this.checkDone();
},
checkDone: function () {
if (!this.inflight) {
this.oncomplete();
}
}
};
scope.Loader = Loader;
});
window.HTMLImports.addModule(function (scope) {
var Observer = function (addCallback) {
this.addCallback = addCallback;
this.mo = new MutationObserver(this.handler.bind(this));
};
Observer.prototype = {
handler: function (mutations) {
for (var i = 0, l = mutations.length, m; i < l && (m = mutations[i]); i++) {
if (m.type === 'childList' && m.addedNodes.length) {
this.addedNodes(m.addedNodes);
}
}
},
addedNodes: function (nodes) {
if (this.addCallback) {
this.addCallback(nodes);
}
for (var i = 0, l = nodes.length, n, loading; i < l && (n = nodes[i]); i++) {
if (n.children && n.children.length) {
this.addedNodes(n.children);
}
}
},
observe: function (root) {
this.mo.observe(root, {
childList: true,
subtree: true
});
}
};
scope.Observer = Observer;
});
window.HTMLImports.addModule(function (scope) {
var path = scope.path;
var rootDocument = scope.rootDocument;
var flags = scope.flags;
var isIE = scope.isIE;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = 'link[rel=' + IMPORT_LINK_TYPE + ']';
var importParser = {
documentSelectors: IMPORT_SELECTOR,
importsSelectors: [
IMPORT_SELECTOR,
'link[rel=stylesheet]:not([type])',
'style:not([type])',
'script:not([type])',
'script[type="application/javascript"]',
'script[type="text/javascript"]'
].join(','),
map: {
link: 'parseLink',
script: 'parseScript',
style: 'parseStyle'
},
dynamicElements: [],
parseNext: function () {
var next = this.nextToParse();
if (next) {
this.parse(next);
}
},
parse: function (elt) {
if (this.isParsed(elt)) {
flags.parse && console.log('[%s] is already parsed', elt.localName);
return;
}
var fn = this[this.map[elt.localName]];
if (fn) {
this.markParsing(elt);
fn.call(this, elt);
}
},
parseDynamic: function (elt, quiet) {
this.dynamicElements.push(elt);
if (!quiet) {
this.parseNext();
}
},
markParsing: function (elt) {
flags.parse && console.log('parsing', elt);
this.parsingElement = elt;
},
markParsingComplete: function (elt) {
elt.__importParsed = true;
this.markDynamicParsingComplete(elt);
if (elt.__importElement) {
elt.__importElement.__importParsed = true;
this.markDynamicParsingComplete(elt.__importElement);
}
this.parsingElement = null;
flags.parse && console.log('completed', elt);
},
markDynamicParsingComplete: function (elt) {
var i = this.dynamicElements.indexOf(elt);
if (i >= 0) {
this.dynamicElements.splice(i, 1);
}
},
parseImport: function (elt) {
elt.import = elt.__doc;
if (window.HTMLImports.__importsParsingHook) {
window.HTMLImports.__importsParsingHook(elt);
}
if (elt.import) {
elt.import.__importParsed = true;
}
this.markParsingComplete(elt);
if (elt.__resource && !elt.__error) {
elt.dispatchEvent(new CustomEvent('load', { bubbles: false }));
} else {
elt.dispatchEvent(new CustomEvent('error', { bubbles: false }));
}
if (elt.__pending) {
var fn;
while (elt.__pending.length) {
fn = elt.__pending.shift();
if (fn) {
fn({ target: elt });
}
}
}
this.parseNext();
},
parseLink: function (linkElt) {
if (nodeIsImport(linkElt)) {
this.parseImport(linkElt);
} else {
linkElt.href = linkElt.href;
this.parseGeneric(linkElt);
}
},
parseStyle: function (elt) {
var src = elt;
elt = cloneStyle(elt);
src.__appliedElement = elt;
elt.__importElement = src;
this.parseGeneric(elt);
},
parseGeneric: function (elt) {
this.trackElement(elt);
this.addElementToDocument(elt);
},
rootImportForElement: function (elt) {
var n = elt;
while (n.ownerDocument.__importLink) {
n = n.ownerDocument.__importLink;
}
return n;
},
addElementToDocument: function (elt) {
var port = this.rootImportForElement(elt.__importElement || elt);
port.parentNode.insertBefore(elt, port);
},
trackElement: function (elt, callback) {
var self = this;
var done = function (e) {
elt.removeEventListener('load', done);
elt.removeEventListener('error', done);
if (callback) {
callback(e);
}
self.markParsingComplete(elt);
self.parseNext();
};
elt.addEventListener('load', done);
elt.addEventListener('error', done);
if (isIE && elt.localName === 'style') {
var fakeLoad = false;
if (elt.textContent.indexOf('@import') == -1) {
fakeLoad = true;
} else if (elt.sheet) {
fakeLoad = true;
var csr = elt.sheet.cssRules;
var len = csr ? csr.length : 0;
for (var i = 0, r; i < len && (r = csr[i]); i++) {
if (r.type === CSSRule.IMPORT_RULE) {
fakeLoad = fakeLoad && Boolean(r.styleSheet);
}
}
}
if (fakeLoad) {
setTimeout(function () {
elt.dispatchEvent(new CustomEvent('load', { bubbles: false }));
});
}
}
},
parseScript: function (scriptElt) {
var script = document.createElement('script');
script.__importElement = scriptElt;
script.src = scriptElt.src ? scriptElt.src : generateScriptDataUrl(scriptElt);
scope.currentScript = scriptElt;
this.trackElement(script, function (e) {
if (script.parentNode) {
script.parentNode.removeChild(script);
}
scope.currentScript = null;
});
this.addElementToDocument(script);
},
nextToParse: function () {
this._mayParse = [];
return !this.parsingElement && (this.nextToParseInDoc(rootDocument) || this.nextToParseDynamic());
},
nextToParseInDoc: function (doc, link) {
if (doc && this._mayParse.indexOf(doc) < 0) {
this._mayParse.push(doc);
var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
for (var i = 0, l = nodes.length, p = 0, n; i < l && (n = nodes[i]); i++) {
if (!this.isParsed(n)) {
if (this.hasResource(n)) {
return nodeIsImport(n) ? this.nextToParseInDoc(n.__doc, n) : n;
} else {
return;
}
}
}
}
return link;
},
nextToParseDynamic: function () {
return this.dynamicElements[0];
},
parseSelectorsForNode: function (node) {
var doc = node.ownerDocument || node;
return doc === rootDocument ? this.documentSelectors : this.importsSelectors;
},
isParsed: function (node) {
return node.__importParsed;
},
needsDynamicParsing: function (elt) {
return this.dynamicElements.indexOf(elt) >= 0;
},
hasResource: function (node) {
if (nodeIsImport(node) && node.__doc === undefined) {
return false;
}
return true;
}
};
function nodeIsImport(elt) {
return elt.localName === 'link' && elt.rel === IMPORT_LINK_TYPE;
}
function generateScriptDataUrl(script) {
var scriptContent = generateScriptContent(script);
return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(scriptContent);
}
function generateScriptContent(script) {
return script.textContent + generateSourceMapHint(script);
}
function generateSourceMapHint(script) {
var owner = script.ownerDocument;
owner.__importedScripts = owner.__importedScripts || 0;
var moniker = script.ownerDocument.baseURI;
var num = owner.__importedScripts ? '-' + owner.__importedScripts : '';
owner.__importedScripts++;
return '\n//# sourceURL=' + moniker + num + '.js\n';
}
function cloneStyle(style) {
var clone = style.ownerDocument.createElement('style');
clone.textContent = style.textContent;
path.resolveUrlsInStyle(clone);
return clone;
}
scope.parser = importParser;
scope.IMPORT_SELECTOR = IMPORT_SELECTOR;
});
window.HTMLImports.addModule(function (scope) {
var flags = scope.flags;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = scope.IMPORT_SELECTOR;
var rootDocument = scope.rootDocument;
var Loader = scope.Loader;
var Observer = scope.Observer;
var parser = scope.parser;
var importer = {
documents: {},
documentPreloadSelectors: IMPORT_SELECTOR,
importsPreloadSelectors: [IMPORT_SELECTOR].join(','),
loadNode: function (node) {
importLoader.addNode(node);
},
loadSubtree: function (parent) {
var nodes = this.marshalNodes(parent);
importLoader.addNodes(nodes);
},
marshalNodes: function (parent) {
return parent.querySelectorAll(this.loadSelectorsForNode(parent));
},
loadSelectorsForNode: function (node) {
var doc = node.ownerDocument || node;
return doc === rootDocument ? this.documentPreloadSelectors : this.importsPreloadSelectors;
},
loaded: function (url, elt, resource, err, redirectedUrl) {
flags.load && console.log('loaded', url, elt);
elt.__resource = resource;
elt.__error = err;
if (isImportLink(elt)) {
var doc = this.documents[url];
if (doc === undefined) {
doc = err ? null : makeDocument(resource, redirectedUrl || url);
if (doc) {
doc.__importLink = elt;
this.bootDocument(doc);
}
this.documents[url] = doc;
}
elt.__doc = doc;
}
parser.parseNext();
},
bootDocument: function (doc) {
this.loadSubtree(doc);
this.observer.observe(doc);
parser.parseNext();
},
loadedAll: function () {
parser.parseNext();
}
};
var importLoader = new Loader(importer.loaded.bind(importer), importer.loadedAll.bind(importer));
importer.observer = new Observer();
function isImportLink(elt) {
return isLinkRel(elt, IMPORT_LINK_TYPE);
}
function isLinkRel(elt, rel) {
return elt.localName === 'link' && elt.getAttribute('rel') === rel;
}
function hasBaseURIAccessor(doc) {
return !!Object.getOwnPropertyDescriptor(doc, 'baseURI');
}
function makeDocument(resource, url) {
var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
doc._URL = url;
var base = doc.createElement('base');
base.setAttribute('href', url);
if (!doc.baseURI && !hasBaseURIAccessor(doc)) {
Object.defineProperty(doc, 'baseURI', { value: url });
}
var meta = doc.createElement('meta');
meta.setAttribute('charset', 'utf-8');
doc.head.appendChild(meta);
doc.head.appendChild(base);
doc.body.innerHTML = resource;
if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
HTMLTemplateElement.bootstrap(doc);
}
return doc;
}
if (!document.baseURI) {
var baseURIDescriptor = {
get: function () {
var base = document.querySelector('base');
return base ? base.href : window.location.href;
},
configurable: true
};
Object.defineProperty(document, 'baseURI', baseURIDescriptor);
Object.defineProperty(rootDocument, 'baseURI', baseURIDescriptor);
}
scope.importer = importer;
scope.importLoader = importLoader;
});
window.HTMLImports.addModule(function (scope) {
var parser = scope.parser;
var importer = scope.importer;
var dynamic = {
added: function (nodes) {
var owner, parsed, loading;
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (!owner) {
owner = n.ownerDocument;
parsed = parser.isParsed(owner);
}
loading = this.shouldLoadNode(n);
if (loading) {
importer.loadNode(n);
}
if (this.shouldParseNode(n) && parsed) {
parser.parseDynamic(n, loading);
}
}
},
shouldLoadNode: function (node) {
return node.nodeType === 1 && matches.call(node, importer.loadSelectorsForNode(node));
},
shouldParseNode: function (node) {
return node.nodeType === 1 && matches.call(node, parser.parseSelectorsForNode(node));
}
};
importer.observer.addCallback = dynamic.added.bind(dynamic);
var matches = HTMLElement.prototype.matches || HTMLElement.prototype.matchesSelector || HTMLElement.prototype.webkitMatchesSelector || HTMLElement.prototype.mozMatchesSelector || HTMLElement.prototype.msMatchesSelector;
});
(function (scope) {
var initializeModules = scope.initializeModules;
var isIE = scope.isIE;
if (scope.useNative) {
return;
}
if (isIE && typeof window.CustomEvent !== 'function') {
window.CustomEvent = function (inType, params) {
params = params || {};
var e = document.createEvent('CustomEvent');
e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
e.preventDefault = function () {
Object.defineProperty(this, 'defaultPrevented', {
get: function () {
return true;
}
});
};
return e;
};
window.CustomEvent.prototype = window.Event.prototype;
}
initializeModules();
var rootDocument = scope.rootDocument;
function bootstrap() {
window.HTMLImports.importer.bootDocument(rootDocument);
}
if (document.readyState === 'complete' || document.readyState === 'interactive' && !window.attachEvent) {
bootstrap();
} else {
document.addEventListener('DOMContentLoaded', bootstrap);
}
}(window.HTMLImports));
window.CustomElements = window.CustomElements || { flags: {} };
(function (scope) {
var flags = scope.flags;
var modules = [];
var addModule = function (module) {
modules.push(module);
};
var initializeModules = function () {
modules.forEach(function (module) {
module(scope);
});
};
scope.addModule = addModule;
scope.initializeModules = initializeModules;
scope.hasNative = Boolean(document.registerElement);
scope.isIE = /Trident/.test(navigator.userAgent);
scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
}(window.CustomElements));
window.CustomElements.addModule(function (scope) {
var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : 'none';
function forSubtree(node, cb) {
findAllElements(node, function (e) {
if (cb(e)) {
return true;
}
forRoots(e, cb);
});
forRoots(node, cb);
}
function findAllElements(node, find, data) {
var e = node.firstElementChild;
if (!e) {
e = node.firstChild;
while (e && e.nodeType !== Node.ELEMENT_NODE) {
e = e.nextSibling;
}
}
while (e) {
if (find(e, data) !== true) {
findAllElements(e, find, data);
}
e = e.nextElementSibling;
}
return null;
}
function forRoots(node, cb) {
var root = node.shadowRoot;
while (root) {
forSubtree(root, cb);
root = root.olderShadowRoot;
}
}
function forDocumentTree(doc, cb) {
_forDocumentTree(doc, cb, []);
}
function _forDocumentTree(doc, cb, processingDocuments) {
doc = window.wrap(doc);
if (processingDocuments.indexOf(doc) >= 0) {
return;
}
processingDocuments.push(doc);
var imports = doc.querySelectorAll('link[rel=' + IMPORT_LINK_TYPE + ']');
for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
if (n.import) {
_forDocumentTree(n.import, cb, processingDocuments);
}
}
cb(doc);
}
scope.forDocumentTree = forDocumentTree;
scope.forSubtree = forSubtree;
});
window.CustomElements.addModule(function (scope) {
var flags = scope.flags;
var forSubtree = scope.forSubtree;
var forDocumentTree = scope.forDocumentTree;
function addedNode(node, isAttached) {
return added(node, isAttached) || addedSubtree(node, isAttached);
}
function added(node, isAttached) {
if (scope.upgrade(node, isAttached)) {
return true;
}
if (isAttached) {
attached(node);
}
}
function addedSubtree(node, isAttached) {
forSubtree(node, function (e) {
if (added(e, isAttached)) {
return true;
}
});
}
var hasPolyfillMutations = !window.MutationObserver || window.MutationObserver === window.JsMutationObserver;
scope.hasPolyfillMutations = hasPolyfillMutations;
var isPendingMutations = false;
var pendingMutations = [];
function deferMutation(fn) {
pendingMutations.push(fn);
if (!isPendingMutations) {
isPendingMutations = true;
setTimeout(takeMutations);
}
}
function takeMutations() {
isPendingMutations = false;
var $p = pendingMutations;
for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
p();
}
pendingMutations = [];
}
function attached(element) {
if (hasPolyfillMutations) {
deferMutation(function () {
_attached(element);
});
} else {
_attached(element);
}
}
function _attached(element) {
if (element.__upgraded__ && !element.__attached) {
element.__attached = true;
if (element.attachedCallback) {
element.attachedCallback();
}
}
}
function detachedNode(node) {
detached(node);
forSubtree(node, function (e) {
detached(e);
});
}
function detached(element) {
if (hasPolyfillMutations) {
deferMutation(function () {
_detached(element);
});
} else {
_detached(element);
}
}
function _detached(element) {
if (element.__upgraded__ && element.__attached) {
element.__attached = false;
if (element.detachedCallback) {
element.detachedCallback();
}
}
}
function inDocument(element) {
var p = element;
var doc = window.wrap(document);
while (p) {
if (p == doc) {
return true;
}
p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
}
}
function watchShadow(node) {
if (node.shadowRoot && !node.shadowRoot.__watched) {
flags.dom && console.log('watching shadow-root for: ', node.localName);
var root = node.shadowRoot;
while (root) {
observe(root);
root = root.olderShadowRoot;
}
}
}
function handler(root, mutations) {
if (flags.dom) {
var mx = mutations[0];
if (mx && mx.type === 'childList' && mx.addedNodes) {
if (mx.addedNodes) {
var d = mx.addedNodes[0];
while (d && d !== document && !d.host) {
d = d.parentNode;
}
var u = d && (d.URL || d._URL || d.host && d.host.localName) || '';
u = u.split('/?').shift().split('/').pop();
}
}
console.group('mutations (%d) [%s]', mutations.length, u || '');
}
var isAttached = inDocument(root);
mutations.forEach(function (mx) {
if (mx.type === 'childList') {
forEach(mx.addedNodes, function (n) {
if (!n.localName) {
return;
}
addedNode(n, isAttached);
});
forEach(mx.removedNodes, function (n) {
if (!n.localName) {
return;
}
detachedNode(n);
});
}
});
flags.dom && console.groupEnd();
}
function takeRecords(node) {
node = window.wrap(node);
if (!node) {
node = window.wrap(document);
}
while (node.parentNode) {
node = node.parentNode;
}
var observer = node.__observer;
if (observer) {
handler(node, observer.takeRecords());
takeMutations();
}
}
var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
function observe(inRoot) {
if (inRoot.__observer) {
return;
}
var observer = new MutationObserver(handler.bind(this, inRoot));
observer.observe(inRoot, {
childList: true,
subtree: true
});
inRoot.__observer = observer;
}
function upgradeDocument(doc) {
doc = window.wrap(doc);
flags.dom && console.group('upgradeDocument: ', doc.baseURI.split('/').pop());
var isMainDocument = doc === window.wrap(document);
addedNode(doc, isMainDocument);
observe(doc);
flags.dom && console.groupEnd();
}
function upgradeDocumentTree(doc) {
forDocumentTree(doc, upgradeDocument);
}
var originalCreateShadowRoot = Element.prototype.createShadowRoot;
if (originalCreateShadowRoot) {
Element.prototype.createShadowRoot = function () {
var root = originalCreateShadowRoot.call(this);
window.CustomElements.watchShadow(this);
return root;
};
}
scope.watchShadow = watchShadow;
scope.upgradeDocumentTree = upgradeDocumentTree;
scope.upgradeDocument = upgradeDocument;
scope.upgradeSubtree = addedSubtree;
scope.upgradeAll = addedNode;
scope.attached = attached;
scope.takeRecords = takeRecords;
});
window.CustomElements.addModule(function (scope) {
var flags = scope.flags;
function upgrade(node, isAttached) {
if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
var is = node.getAttribute('is');
var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
if (definition) {
if (is && definition.tag == node.localName || !is && !definition.extends) {
return upgradeWithDefinition(node, definition, isAttached);
}
}
}
}
function upgradeWithDefinition(element, definition, isAttached) {
flags.upgrade && console.group('upgrade:', element.localName);
if (definition.is) {
element.setAttribute('is', definition.is);
}
implementPrototype(element, definition);
element.__upgraded__ = true;
created(element);
if (isAttached) {
scope.attached(element);
}
scope.upgradeSubtree(element, isAttached);
flags.upgrade && console.groupEnd();
return element;
}
function implementPrototype(element, definition) {
if (Object.__proto__) {
element.__proto__ = definition.prototype;
} else {
customMixin(element, definition.prototype, definition.native);
element.__proto__ = definition.prototype;
}
}
function customMixin(inTarget, inSrc, inNative) {
var used = {};
var p = inSrc;
while (p !== inNative && p !== HTMLElement.prototype) {
var keys = Object.getOwnPropertyNames(p);
for (var i = 0, k; k = keys[i]; i++) {
if (!used[k]) {
Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
used[k] = 1;
}
}
p = Object.getPrototypeOf(p);
}
}
function created(element) {
if (element.createdCallback) {
element.createdCallback();
}
}
scope.upgrade = upgrade;
scope.upgradeWithDefinition = upgradeWithDefinition;
scope.implementPrototype = implementPrototype;
});
window.CustomElements.addModule(function (scope) {
var isIE = scope.isIE;
var upgradeDocumentTree = scope.upgradeDocumentTree;
var upgradeAll = scope.upgradeAll;
var upgradeWithDefinition = scope.upgradeWithDefinition;
var implementPrototype = scope.implementPrototype;
var useNative = scope.useNative;
function register(name, options) {
var definition = options || {};
if (!name) {
throw new Error('document.registerElement: first argument `name` must not be empty');
}
if (name.indexOf('-') < 0) {
throw new Error('document.registerElement: first argument (\'name\') must contain a dash (\'-\'). Argument provided was \'' + String(name) + '\'.');
}
if (isReservedTag(name)) {
throw new Error('Failed to execute \'registerElement\' on \'Document\': Registration failed for type \'' + String(name) + '\'. The type name is invalid.');
}
if (getRegisteredDefinition(name)) {
throw new Error('DuplicateDefinitionError: a type with name \'' + String(name) + '\' is already registered');
}
if (!definition.prototype) {
definition.prototype = Object.create(HTMLElement.prototype);
}
definition.__name = name.toLowerCase();
definition.lifecycle = definition.lifecycle || {};
definition.ancestry = ancestry(definition.extends);
resolveTagName(definition);
resolvePrototypeChain(definition);
overrideAttributeApi(definition.prototype);
registerDefinition(definition.__name, definition);
definition.ctor = generateConstructor(definition);
definition.ctor.prototype = definition.prototype;
definition.prototype.constructor = definition.ctor;
if (scope.ready) {
upgradeDocumentTree(document);
}
return definition.ctor;
}
function overrideAttributeApi(prototype) {
if (prototype.setAttribute._polyfilled) {
return;
}
var setAttribute = prototype.setAttribute;
prototype.setAttribute = function (name, value) {
changeAttribute.call(this, name, value, setAttribute);
};
var removeAttribute = prototype.removeAttribute;
prototype.removeAttribute = function (name) {
changeAttribute.call(this, name, null, removeAttribute);
};
prototype.setAttribute._polyfilled = true;
}
function changeAttribute(name, value, operation) {
name = name.toLowerCase();
var oldValue = this.getAttribute(name);
operation.apply(this, arguments);
var newValue = this.getAttribute(name);
if (this.attributeChangedCallback && newValue !== oldValue) {
this.attributeChangedCallback(name, oldValue, newValue);
}
}
function isReservedTag(name) {
for (var i = 0; i < reservedTagList.length; i++) {
if (name === reservedTagList[i]) {
return true;
}
}
}
var reservedTagList = [
'annotation-xml',
'color-profile',
'font-face',
'font-face-src',
'font-face-uri',
'font-face-format',
'font-face-name',
'missing-glyph'
];
function ancestry(extnds) {
var extendee = getRegisteredDefinition(extnds);
if (extendee) {
return ancestry(extendee.extends).concat([extendee]);
}
return [];
}
function resolveTagName(definition) {
var baseTag = definition.extends;
for (var i = 0, a; a = definition.ancestry[i]; i++) {
baseTag = a.is && a.tag;
}
definition.tag = baseTag || definition.__name;
if (baseTag) {
definition.is = definition.__name;
}
}
function resolvePrototypeChain(definition) {
if (!Object.__proto__) {
var nativePrototype = HTMLElement.prototype;
if (definition.is) {
var inst = document.createElement(definition.tag);
nativePrototype = Object.getPrototypeOf(inst);
}
var proto = definition.prototype, ancestor;
var foundPrototype = false;
while (proto) {
if (proto == nativePrototype) {
foundPrototype = true;
}
ancestor = Object.getPrototypeOf(proto);
if (ancestor) {
proto.__proto__ = ancestor;
}
proto = ancestor;
}
if (!foundPrototype) {
console.warn(definition.tag + ' prototype not found in prototype chain for ' + definition.is);
}
definition.native = nativePrototype;
}
}
function instantiate(definition) {
return upgradeWithDefinition(domCreateElement(definition.tag), definition);
}
var registry = {};
function getRegisteredDefinition(name) {
if (name) {
return registry[name.toLowerCase()];
}
}
function registerDefinition(name, definition) {
registry[name] = definition;
}
function generateConstructor(definition) {
return function () {
return instantiate(definition);
};
}
var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
function createElementNS(namespace, tag, typeExtension) {
if (namespace === HTML_NAMESPACE) {
return createElement(tag, typeExtension);
} else {
return domCreateElementNS(namespace, tag);
}
}
function createElement(tag, typeExtension) {
if (tag) {
tag = tag.toLowerCase();
}
if (typeExtension) {
typeExtension = typeExtension.toLowerCase();
}
var definition = getRegisteredDefinition(typeExtension || tag);
if (definition) {
if (tag == definition.tag && typeExtension == definition.is) {
return new definition.ctor();
}
if (!typeExtension && !definition.is) {
return new definition.ctor();
}
}
var element;
if (typeExtension) {
element = createElement(tag);
element.setAttribute('is', typeExtension);
return element;
}
element = domCreateElement(tag);
if (tag.indexOf('-') >= 0) {
implementPrototype(element, HTMLElement);
}
return element;
}
var domCreateElement = document.createElement.bind(document);
var domCreateElementNS = document.createElementNS.bind(document);
var isInstance;
if (!Object.__proto__ && !useNative) {
isInstance = function (obj, ctor) {
if (obj instanceof ctor) {
return true;
}
var p = obj;
while (p) {
if (p === ctor.prototype) {
return true;
}
p = p.__proto__;
}
return false;
};
} else {
isInstance = function (obj, base) {
return obj instanceof base;
};
}
function wrapDomMethodToForceUpgrade(obj, methodName) {
var orig = obj[methodName];
obj[methodName] = function () {
var n = orig.apply(this, arguments);
upgradeAll(n);
return n;
};
}
wrapDomMethodToForceUpgrade(Node.prototype, 'cloneNode');
wrapDomMethodToForceUpgrade(document, 'importNode');
if (isIE) {
(function () {
var importNode = document.importNode;
document.importNode = function () {
var n = importNode.apply(document, arguments);
if (n.nodeType == n.DOCUMENT_FRAGMENT_NODE) {
var f = document.createDocumentFragment();
f.appendChild(n);
return f;
} else {
return n;
}
};
}());
}
document.registerElement = register;
document.createElement = createElement;
document.createElementNS = createElementNS;
scope.registry = registry;
scope.instanceof = isInstance;
scope.reservedTagList = reservedTagList;
scope.getRegisteredDefinition = getRegisteredDefinition;
document.register = document.registerElement;
});
(function (scope) {
var useNative = scope.useNative;
var initializeModules = scope.initializeModules;
var isIE = scope.isIE;
if (useNative) {
var nop = function () {
};
scope.watchShadow = nop;
scope.upgrade = nop;
scope.upgradeAll = nop;
scope.upgradeDocumentTree = nop;
scope.upgradeSubtree = nop;
scope.takeRecords = nop;
scope.instanceof = function (obj, base) {
return obj instanceof base;
};
} else {
initializeModules();
}
var upgradeDocumentTree = scope.upgradeDocumentTree;
var upgradeDocument = scope.upgradeDocument;
if (!window.wrap) {
if (window.ShadowDOMPolyfill) {
window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
} else {
window.wrap = window.unwrap = function (node) {
return node;
};
}
}
if (window.HTMLImports) {
window.HTMLImports.__importsParsingHook = function (elt) {
if (elt.import) {
upgradeDocument(wrap(elt.import));
}
};
}
function bootstrap() {
upgradeDocumentTree(window.wrap(document));
window.CustomElements.ready = true;
var requestAnimationFrame = window.requestAnimationFrame || function (f) {
setTimeout(f, 16);
};
requestAnimationFrame(function () {
setTimeout(function () {
window.CustomElements.readyTime = Date.now();
if (window.HTMLImports) {
window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
}
document.dispatchEvent(new CustomEvent('WebComponentsReady', { bubbles: true }));
});
});
}
if (isIE && typeof window.CustomEvent !== 'function') {
window.CustomEvent = function (inType, params) {
params = params || {};
var e = document.createEvent('CustomEvent');
e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
e.preventDefault = function () {
Object.defineProperty(this, 'defaultPrevented', {
get: function () {
return true;
}
});
};
return e;
};
window.CustomEvent.prototype = window.Event.prototype;
}
if (document.readyState === 'complete' || scope.flags.eager) {
bootstrap();
} else if (document.readyState === 'interactive' && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
bootstrap();
} else {
var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? 'HTMLImportsLoaded' : 'DOMContentLoaded';
window.addEventListener(loadEvent, bootstrap);
}
}(window.CustomElements));
if (typeof HTMLTemplateElement === 'undefined') {
(function () {
var TEMPLATE_TAG = 'template';
var contentDoc = document.implementation.createHTMLDocument('template');
var canDecorate = true;
HTMLTemplateElement = function () {
};
HTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);
HTMLTemplateElement.decorate = function (template) {
if (!template.content) {
template.content = contentDoc.createDocumentFragment();
}
var child;
while (child = template.firstChild) {
template.content.appendChild(child);
}
if (canDecorate) {
try {
Object.defineProperty(template, 'innerHTML', {
get: function () {
var o = '';
for (var e = this.content.firstChild; e; e = e.nextSibling) {
o += e.outerHTML || escapeData(e.data);
}
return o;
},
set: function (text) {
contentDoc.body.innerHTML = text;
HTMLTemplateElement.bootstrap(contentDoc);
while (this.content.firstChild) {
this.content.removeChild(this.content.firstChild);
}
while (contentDoc.body.firstChild) {
this.content.appendChild(contentDoc.body.firstChild);
}
},
configurable: true
});
} catch (err) {
canDecorate = false;
}
}
};
HTMLTemplateElement.bootstrap = function (doc) {
var templates = doc.querySelectorAll(TEMPLATE_TAG);
for (var i = 0, l = templates.length, t; i < l && (t = templates[i]); i++) {
HTMLTemplateElement.decorate(t);
}
};
window.addEventListener('DOMContentLoaded', function () {
HTMLTemplateElement.bootstrap(document);
});
var createElement = document.createElement;
document.createElement = function () {
'use strict';
var el = createElement.apply(document, arguments);
if (el.localName == 'template') {
HTMLTemplateElement.decorate(el);
}
return el;
};
var escapeDataRegExp = /[&\u00A0<>]/g;
function escapeReplace(c) {
switch (c) {
case '&':
return '&amp;';
case '<':
return '&lt;';
case '>':
return '&gt;';
case '\xA0':
return '&nbsp;';
}
}
function escapeData(s) {
return s.replace(escapeDataRegExp, escapeReplace);
}
}());
}
(function (scope) {
var style = document.createElement('style');
style.textContent = '' + 'body {' + 'transition: opacity ease-in 0.2s;' + ' } \n' + 'body[unresolved] {' + 'opacity: 0; display: block; overflow: hidden; position: relative;' + ' } \n';
var head = document.querySelector('head');
head.insertBefore(style, head.firstChild);
}(window.WebComponents));
;(function () {
function resolve() {
document.body.removeAttribute('unresolved');
}
if (window.WebComponents) {
addEventListener('WebComponentsReady', resolve);
} else {
if (document.readyState === 'interactive' || document.readyState === 'complete') {
resolve();
} else {
addEventListener('DOMContentLoaded', resolve);
}
}
}());
window.Polymer = {
Settings: function () {
var user = window.Polymer || {};
location.search.slice(1).split('&').forEach(function (o) {
o = o.split('=');
o[0] && (user[o[0]] = o[1] || true);
});
var wantShadow = user.dom === 'shadow';
var hasShadow = Boolean(Element.prototype.createShadowRoot);
var nativeShadow = hasShadow && !window.ShadowDOMPolyfill;
var useShadow = wantShadow && hasShadow;
var hasNativeImports = Boolean('import' in document.createElement('link'));
var useNativeImports = hasNativeImports;
var useNativeCustomElements = !window.CustomElements || window.CustomElements.useNative;
return {
wantShadow: wantShadow,
hasShadow: hasShadow,
nativeShadow: nativeShadow,
useShadow: useShadow,
useNativeShadow: useShadow && nativeShadow,
useNativeImports: useNativeImports,
useNativeCustomElements: useNativeCustomElements
};
}()
};
(function () {
var userPolymer = window.Polymer;
window.Polymer = function (prototype) {
if (typeof prototype === 'function') {
prototype = prototype.prototype;
}
if (!prototype) {
prototype = {};
}
var factory = desugar(prototype);
prototype = factory.prototype;
var options = { prototype: prototype };
if (prototype.extends) {
options.extends = prototype.extends;
}
Polymer.telemetry._registrate(prototype);
document.registerElement(prototype.is, options);
return factory;
};
var desugar = function (prototype) {
var base = Polymer.Base;
if (prototype.extends) {
base = Polymer.Base._getExtendedPrototype(prototype.extends);
}
prototype = Polymer.Base.chainObject(prototype, base);
prototype.registerCallback();
return prototype.constructor;
};
window.Polymer = Polymer;
if (userPolymer) {
for (var i in userPolymer) {
Polymer[i] = userPolymer[i];
}
}
Polymer.Class = desugar;
}());
Polymer.telemetry = {
registrations: [],
_regLog: function (prototype) {
console.log('[' + prototype.is + ']: registered');
},
_registrate: function (prototype) {
this.registrations.push(prototype);
Polymer.log && this._regLog(prototype);
},
dumpRegistrations: function () {
this.registrations.forEach(this._regLog);
}
};
Object.defineProperty(window, 'currentImport', {
enumerable: true,
configurable: true,
get: function () {
return (document._currentScript || document.currentScript).ownerDocument;
}
});
Polymer.RenderStatus = {
_ready: false,
_callbacks: [],
whenReady: function (cb) {
if (this._ready) {
cb();
} else {
this._callbacks.push(cb);
}
},
_makeReady: function () {
this._ready = true;
this._callbacks.forEach(function (cb) {
cb();
});
this._callbacks = [];
},
_catchFirstRender: function () {
requestAnimationFrame(function () {
Polymer.RenderStatus._makeReady();
});
}
};
if (window.HTMLImports) {
HTMLImports.whenReady(function () {
Polymer.RenderStatus._catchFirstRender();
});
} else {
Polymer.RenderStatus._catchFirstRender();
}
Polymer.ImportStatus = Polymer.RenderStatus;
Polymer.ImportStatus.whenLoaded = Polymer.ImportStatus.whenReady;
Polymer.Base = {
__isPolymerInstance__: true,
_addFeature: function (feature) {
this.extend(this, feature);
},
registerCallback: function () {
this._desugarBehaviors();
this._doBehavior('beforeRegister');
this._registerFeatures();
this._doBehavior('registered');
},
createdCallback: function () {
Polymer.telemetry.instanceCount++;
this.root = this;
this._doBehavior('created');
this._initFeatures();
},
attachedCallback: function () {
Polymer.RenderStatus.whenReady(function () {
this.isAttached = true;
this._doBehavior('attached');
}.bind(this));
},
detachedCallback: function () {
this.isAttached = false;
this._doBehavior('detached');
},
attributeChangedCallback: function (name) {
this._attributeChangedImpl(name);
this._doBehavior('attributeChanged', arguments);
},
_attributeChangedImpl: function (name) {
this._setAttributeToProperty(this, name);
},
extend: function (prototype, api) {
if (prototype && api) {
Object.getOwnPropertyNames(api).forEach(function (n) {
this.copyOwnProperty(n, api, prototype);
}, this);
}
return prototype || api;
},
mixin: function (target, source) {
for (var i in source) {
target[i] = source[i];
}
return target;
},
copyOwnProperty: function (name, source, target) {
var pd = Object.getOwnPropertyDescriptor(source, name);
if (pd) {
Object.defineProperty(target, name, pd);
}
},
_log: console.log.apply.bind(console.log, console),
_warn: console.warn.apply.bind(console.warn, console),
_error: console.error.apply.bind(console.error, console),
_logf: function () {
return this._logPrefix.concat([this.is]).concat(Array.prototype.slice.call(arguments, 0));
}
};
Polymer.Base._logPrefix = function () {
var color = window.chrome || /firefox/i.test(navigator.userAgent);
return color ? [
'%c[%s::%s]:',
'font-weight: bold; background-color:#EEEE00;'
] : ['[%s::%s]:'];
}();
Polymer.Base.chainObject = function (object, inherited) {
if (object && inherited && object !== inherited) {
if (!Object.__proto__) {
object = Polymer.Base.extend(Object.create(inherited), object);
}
object.__proto__ = inherited;
}
return object;
};
Polymer.Base = Polymer.Base.chainObject(Polymer.Base, HTMLElement.prototype);
if (window.CustomElements) {
Polymer.instanceof = CustomElements.instanceof;
} else {
Polymer.instanceof = function (obj, ctor) {
return obj instanceof ctor;
};
}
Polymer.isInstance = function (obj) {
return Boolean(obj && obj.__isPolymerInstance__);
};
Polymer.telemetry.instanceCount = 0;
(function () {
var modules = {};
var lcModules = {};
var findModule = function (id) {
return modules[id] || lcModules[id.toLowerCase()];
};
var DomModule = function () {
return document.createElement('dom-module');
};
DomModule.prototype = Object.create(HTMLElement.prototype);
Polymer.Base.extend(DomModule.prototype, {
constructor: DomModule,
createdCallback: function () {
this.register();
},
register: function (id) {
var id = id || this.id || this.getAttribute('name') || this.getAttribute('is');
if (id) {
this.id = id;
modules[id] = this;
lcModules[id.toLowerCase()] = this;
}
},
import: function (id, selector) {
if (id) {
var m = findModule(id);
if (!m) {
forceDocumentUpgrade();
m = findModule(id);
}
if (m && selector) {
m = m.querySelector(selector);
}
return m;
}
}
});
var cePolyfill = window.CustomElements && !CustomElements.useNative;
document.registerElement('dom-module', DomModule);
function forceDocumentUpgrade() {
if (cePolyfill) {
var script = document._currentScript || document.currentScript;
var doc = script && script.ownerDocument;
if (doc) {
CustomElements.upgradeAll(doc);
}
}
}
}());
Polymer.Base._addFeature({
_prepIs: function () {
if (!this.is) {
var module = (document._currentScript || document.currentScript).parentNode;
if (module.localName === 'dom-module') {
var id = module.id || module.getAttribute('name') || module.getAttribute('is');
this.is = id;
}
}
if (this.is) {
this.is = this.is.toLowerCase();
}
}
});
Polymer.Base._addFeature({
behaviors: [],
_desugarBehaviors: function () {
if (this.behaviors.length) {
this.behaviors = this._desugarSomeBehaviors(this.behaviors);
}
},
_desugarSomeBehaviors: function (behaviors) {
behaviors = this._flattenBehaviorsList(behaviors);
for (var i = behaviors.length - 1; i >= 0; i--) {
this._mixinBehavior(behaviors[i]);
}
return behaviors;
},
_flattenBehaviorsList: function (behaviors) {
var flat = [];
behaviors.forEach(function (b) {
if (b instanceof Array) {
flat = flat.concat(this._flattenBehaviorsList(b));
} else if (b) {
flat.push(b);
} else {
this._warn(this._logf('_flattenBehaviorsList', 'behavior is null, check for missing or 404 import'));
}
}, this);
return flat;
},
_mixinBehavior: function (b) {
Object.getOwnPropertyNames(b).forEach(function (n) {
switch (n) {
case 'hostAttributes':
case 'registered':
case 'properties':
case 'observers':
case 'listeners':
case 'created':
case 'attached':
case 'detached':
case 'attributeChanged':
case 'configure':
case 'ready':
break;
default:
if (!this.hasOwnProperty(n)) {
this.copyOwnProperty(n, b, this);
}
break;
}
}, this);
},
_prepBehaviors: function () {
this._prepFlattenedBehaviors(this.behaviors);
},
_prepFlattenedBehaviors: function (behaviors) {
for (var i = 0, l = behaviors.length; i < l; i++) {
this._prepBehavior(behaviors[i]);
}
this._prepBehavior(this);
},
_doBehavior: function (name, args) {
this.behaviors.forEach(function (b) {
this._invokeBehavior(b, name, args);
}, this);
this._invokeBehavior(this, name, args);
},
_invokeBehavior: function (b, name, args) {
var fn = b[name];
if (fn) {
fn.apply(this, args || Polymer.nar);
}
},
_marshalBehaviors: function () {
this.behaviors.forEach(function (b) {
this._marshalBehavior(b);
}, this);
this._marshalBehavior(this);
}
});
Polymer.Base._addFeature({
_getExtendedPrototype: function (tag) {
return this._getExtendedNativePrototype(tag);
},
_nativePrototypes: {},
_getExtendedNativePrototype: function (tag) {
var p = this._nativePrototypes[tag];
if (!p) {
var np = this.getNativePrototype(tag);
p = this.extend(Object.create(np), Polymer.Base);
this._nativePrototypes[tag] = p;
}
return p;
},
getNativePrototype: function (tag) {
return Object.getPrototypeOf(document.createElement(tag));
}
});
Polymer.Base._addFeature({
_prepConstructor: function () {
this._factoryArgs = this.extends ? [
this.extends,
this.is
] : [this.is];
var ctor = function () {
return this._factory(arguments);
};
if (this.hasOwnProperty('extends')) {
ctor.extends = this.extends;
}
Object.defineProperty(this, 'constructor', {
value: ctor,
writable: true,
configurable: true
});
ctor.prototype = this;
},
_factory: function (args) {
var elt = document.createElement.apply(document, this._factoryArgs);
if (this.factoryImpl) {
this.factoryImpl.apply(elt, args);
}
return elt;
}
});
Polymer.nob = Object.create(null);
Polymer.Base._addFeature({
properties: {},
getPropertyInfo: function (property) {
var info = this._getPropertyInfo(property, this.properties);
if (!info) {
this.behaviors.some(function (b) {
return info = this._getPropertyInfo(property, b.properties);
}, this);
}
return info || Polymer.nob;
},
_getPropertyInfo: function (property, properties) {
var p = properties && properties[property];
if (typeof p === 'function') {
p = properties[property] = { type: p };
}
if (p) {
p.defined = true;
}
return p;
}
});
Polymer.CaseMap = {
_caseMap: {},
dashToCamelCase: function (dash) {
var mapped = Polymer.CaseMap._caseMap[dash];
if (mapped) {
return mapped;
}
if (dash.indexOf('-') < 0) {
return Polymer.CaseMap._caseMap[dash] = dash;
}
return Polymer.CaseMap._caseMap[dash] = dash.replace(/-([a-z])/g, function (m) {
return m[1].toUpperCase();
});
},
camelToDashCase: function (camel) {
var mapped = Polymer.CaseMap._caseMap[camel];
if (mapped) {
return mapped;
}
return Polymer.CaseMap._caseMap[camel] = camel.replace(/([a-z][A-Z])/g, function (g) {
return g[0] + '-' + g[1].toLowerCase();
});
}
};
Polymer.Base._addFeature({
_prepAttributes: function () {
this._aggregatedAttributes = {};
},
_addHostAttributes: function (attributes) {
if (attributes) {
this.mixin(this._aggregatedAttributes, attributes);
}
},
_marshalHostAttributes: function () {
this._applyAttributes(this, this._aggregatedAttributes);
},
_applyAttributes: function (node, attr$) {
for (var n in attr$) {
if (!this.hasAttribute(n) && n !== 'class') {
this.serializeValueToAttribute(attr$[n], n, this);
}
}
},
_marshalAttributes: function () {
this._takeAttributesToModel(this);
},
_takeAttributesToModel: function (model) {
for (var i = 0, l = this.attributes.length; i < l; i++) {
this._setAttributeToProperty(model, this.attributes[i].name);
}
},
_setAttributeToProperty: function (model, attrName) {
if (!this._serializing) {
var propName = Polymer.CaseMap.dashToCamelCase(attrName);
var info = this.getPropertyInfo(propName);
if (info.defined || this._propertyEffects && this._propertyEffects[propName]) {
var val = this.getAttribute(attrName);
model[propName] = this.deserialize(val, info.type);
}
}
},
_serializing: false,
reflectPropertyToAttribute: function (name) {
this._serializing = true;
this.serializeValueToAttribute(this[name], Polymer.CaseMap.camelToDashCase(name));
this._serializing = false;
},
serializeValueToAttribute: function (value, attribute, node) {
var str = this.serialize(value);
(node || this)[str === undefined ? 'removeAttribute' : 'setAttribute'](attribute, str);
},
deserialize: function (value, type) {
switch (type) {
case Number:
value = Number(value);
break;
case Boolean:
value = value !== null;
break;
case Object:
try {
value = JSON.parse(value);
} catch (x) {
}
break;
case Array:
try {
value = JSON.parse(value);
} catch (x) {
value = null;
console.warn('Polymer::Attributes: couldn`t decode Array as JSON');
}
break;
case Date:
value = new Date(value);
break;
case String:
default:
break;
}
return value;
},
serialize: function (value) {
switch (typeof value) {
case 'boolean':
return value ? '' : undefined;
case 'object':
if (value instanceof Date) {
return value;
} else if (value) {
try {
return JSON.stringify(value);
} catch (x) {
return '';
}
}
default:
return value != null ? value : undefined;
}
}
});
Polymer.Base._addFeature({
_setupDebouncers: function () {
this._debouncers = {};
},
debounce: function (jobName, callback, wait) {
return this._debouncers[jobName] = Polymer.Debounce.call(this, this._debouncers[jobName], callback, wait);
},
isDebouncerActive: function (jobName) {
var debouncer = this._debouncers[jobName];
return debouncer && debouncer.finish;
},
flushDebouncer: function (jobName) {
var debouncer = this._debouncers[jobName];
if (debouncer) {
debouncer.complete();
}
},
cancelDebouncer: function (jobName) {
var debouncer = this._debouncers[jobName];
if (debouncer) {
debouncer.stop();
}
}
});
Polymer.version = '1.1.3';
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepAttributes();
this._prepBehaviors();
this._prepConstructor();
},
_prepBehavior: function (b) {
this._addHostAttributes(b.hostAttributes);
},
_marshalBehavior: function (b) {
},
_initFeatures: function () {
this._marshalHostAttributes();
this._setupDebouncers();
this._marshalBehaviors();
}
});
;Polymer.Base._addFeature({
_prepTemplate: function () {
this._template = this._template || Polymer.DomModule.import(this.is, 'template');
if (this._template && this._template.hasAttribute('is')) {
this._warn(this._logf('_prepTemplate', 'top-level Polymer template ' + 'must not be a type-extension, found', this._template, 'Move inside simple <template>.'));
}
if (this._template && !this._template.content && HTMLTemplateElement.bootstrap) {
HTMLTemplateElement.decorate(this._template);
HTMLTemplateElement.bootstrap(this._template.content);
}
},
_stampTemplate: function () {
if (this._template) {
this.root = this.instanceTemplate(this._template);
}
},
instanceTemplate: function (template) {
var dom = document.importNode(template._content || template.content, true);
return dom;
}
});
(function () {
var baseAttachedCallback = Polymer.Base.attachedCallback;
Polymer.Base._addFeature({
_hostStack: [],
ready: function () {
},
_pushHost: function (host) {
this.dataHost = host = host || Polymer.Base._hostStack[Polymer.Base._hostStack.length - 1];
if (host && host._clients) {
host._clients.push(this);
}
this._beginHost();
},
_beginHost: function () {
Polymer.Base._hostStack.push(this);
if (!this._clients) {
this._clients = [];
}
},
_popHost: function () {
Polymer.Base._hostStack.pop();
},
_tryReady: function () {
if (this._canReady()) {
this._ready();
}
},
_canReady: function () {
return !this.dataHost || this.dataHost._clientsReadied;
},
_ready: function () {
this._beforeClientsReady();
this._setupRoot();
this._readyClients();
this._afterClientsReady();
this._readySelf();
},
_readyClients: function () {
this._beginDistribute();
var c$ = this._clients;
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
c._ready();
}
this._finishDistribute();
this._clientsReadied = true;
this._clients = null;
},
_readySelf: function () {
this._doBehavior('ready');
this._readied = true;
if (this._attachedPending) {
this._attachedPending = false;
this.attachedCallback();
}
},
_beforeClientsReady: function () {
},
_afterClientsReady: function () {
},
_beforeAttached: function () {
},
attachedCallback: function () {
if (this._readied) {
this._beforeAttached();
baseAttachedCallback.call(this);
} else {
this._attachedPending = true;
}
}
});
}());
Polymer.ArraySplice = function () {
function newSplice(index, removed, addedCount) {
return {
index: index,
removed: removed,
addedCount: addedCount
};
}
var EDIT_LEAVE = 0;
var EDIT_UPDATE = 1;
var EDIT_ADD = 2;
var EDIT_DELETE = 3;
function ArraySplice() {
}
ArraySplice.prototype = {
calcEditDistances: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
var rowCount = oldEnd - oldStart + 1;
var columnCount = currentEnd - currentStart + 1;
var distances = new Array(rowCount);
for (var i = 0; i < rowCount; i++) {
distances[i] = new Array(columnCount);
distances[i][0] = i;
}
for (var j = 0; j < columnCount; j++)
distances[0][j] = j;
for (var i = 1; i < rowCount; i++) {
for (var j = 1; j < columnCount; j++) {
if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
distances[i][j] = distances[i - 1][j - 1];
else {
var north = distances[i - 1][j] + 1;
var west = distances[i][j - 1] + 1;
distances[i][j] = north < west ? north : west;
}
}
}
return distances;
},
spliceOperationsFromEditDistances: function (distances) {
var i = distances.length - 1;
var j = distances[0].length - 1;
var current = distances[i][j];
var edits = [];
while (i > 0 || j > 0) {
if (i == 0) {
edits.push(EDIT_ADD);
j--;
continue;
}
if (j == 0) {
edits.push(EDIT_DELETE);
i--;
continue;
}
var northWest = distances[i - 1][j - 1];
var west = distances[i - 1][j];
var north = distances[i][j - 1];
var min;
if (west < north)
min = west < northWest ? west : northWest;
else
min = north < northWest ? north : northWest;
if (min == northWest) {
if (northWest == current) {
edits.push(EDIT_LEAVE);
} else {
edits.push(EDIT_UPDATE);
current = northWest;
}
i--;
j--;
} else if (min == west) {
edits.push(EDIT_DELETE);
i--;
current = west;
} else {
edits.push(EDIT_ADD);
j--;
current = north;
}
}
edits.reverse();
return edits;
},
calcSplices: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
var prefixCount = 0;
var suffixCount = 0;
var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
if (currentStart == 0 && oldStart == 0)
prefixCount = this.sharedPrefix(current, old, minLength);
if (currentEnd == current.length && oldEnd == old.length)
suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
currentStart += prefixCount;
oldStart += prefixCount;
currentEnd -= suffixCount;
oldEnd -= suffixCount;
if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
return [];
if (currentStart == currentEnd) {
var splice = newSplice(currentStart, [], 0);
while (oldStart < oldEnd)
splice.removed.push(old[oldStart++]);
return [splice];
} else if (oldStart == oldEnd)
return [newSplice(currentStart, [], currentEnd - currentStart)];
var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
var splice = undefined;
var splices = [];
var index = currentStart;
var oldIndex = oldStart;
for (var i = 0; i < ops.length; i++) {
switch (ops[i]) {
case EDIT_LEAVE:
if (splice) {
splices.push(splice);
splice = undefined;
}
index++;
oldIndex++;
break;
case EDIT_UPDATE:
if (!splice)
splice = newSplice(index, [], 0);
splice.addedCount++;
index++;
splice.removed.push(old[oldIndex]);
oldIndex++;
break;
case EDIT_ADD:
if (!splice)
splice = newSplice(index, [], 0);
splice.addedCount++;
index++;
break;
case EDIT_DELETE:
if (!splice)
splice = newSplice(index, [], 0);
splice.removed.push(old[oldIndex]);
oldIndex++;
break;
}
}
if (splice) {
splices.push(splice);
}
return splices;
},
sharedPrefix: function (current, old, searchLength) {
for (var i = 0; i < searchLength; i++)
if (!this.equals(current[i], old[i]))
return i;
return searchLength;
},
sharedSuffix: function (current, old, searchLength) {
var index1 = current.length;
var index2 = old.length;
var count = 0;
while (count < searchLength && this.equals(current[--index1], old[--index2]))
count++;
return count;
},
calculateSplices: function (current, previous) {
return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
},
equals: function (currentValue, previousValue) {
return currentValue === previousValue;
}
};
return new ArraySplice();
}();
Polymer.EventApi = function () {
var Settings = Polymer.Settings;
var EventApi = function (event) {
this.event = event;
};
if (Settings.useShadow) {
EventApi.prototype = {
get rootTarget() {
return this.event.path[0];
},
get localTarget() {
return this.event.target;
},
get path() {
return this.event.path;
}
};
} else {
EventApi.prototype = {
get rootTarget() {
return this.event.target;
},
get localTarget() {
var current = this.event.currentTarget;
var currentRoot = current && Polymer.dom(current).getOwnerRoot();
var p$ = this.path;
for (var i = 0; i < p$.length; i++) {
if (Polymer.dom(p$[i]).getOwnerRoot() === currentRoot) {
return p$[i];
}
}
},
get path() {
if (!this.event._path) {
var path = [];
var o = this.rootTarget;
while (o) {
path.push(o);
o = Polymer.dom(o).parentNode || o.host;
}
path.push(window);
this.event._path = path;
}
return this.event._path;
}
};
}
var factory = function (event) {
if (!event.__eventApi) {
event.__eventApi = new EventApi(event);
}
return event.__eventApi;
};
return { factory: factory };
}();
Polymer.domInnerHTML = function () {
var escapeAttrRegExp = /[&\u00A0"]/g;
var escapeDataRegExp = /[&\u00A0<>]/g;
function escapeReplace(c) {
switch (c) {
case '&':
return '&amp;';
case '<':
return '&lt;';
case '>':
return '&gt;';
case '"':
return '&quot;';
case '\xA0':
return '&nbsp;';
}
}
function escapeAttr(s) {
return s.replace(escapeAttrRegExp, escapeReplace);
}
function escapeData(s) {
return s.replace(escapeDataRegExp, escapeReplace);
}
function makeSet(arr) {
var set = {};
for (var i = 0; i < arr.length; i++) {
set[arr[i]] = true;
}
return set;
}
var voidElements = makeSet([
'area',
'base',
'br',
'col',
'command',
'embed',
'hr',
'img',
'input',
'keygen',
'link',
'meta',
'param',
'source',
'track',
'wbr'
]);
var plaintextParents = makeSet([
'style',
'script',
'xmp',
'iframe',
'noembed',
'noframes',
'plaintext',
'noscript'
]);
function getOuterHTML(node, parentNode, composed) {
switch (node.nodeType) {
case Node.ELEMENT_NODE:
var tagName = node.localName;
var s = '<' + tagName;
var attrs = node.attributes;
for (var i = 0, attr; attr = attrs[i]; i++) {
s += ' ' + attr.name + '="' + escapeAttr(attr.value) + '"';
}
s += '>';
if (voidElements[tagName]) {
return s;
}
return s + getInnerHTML(node, composed) + '</' + tagName + '>';
case Node.TEXT_NODE:
var data = node.data;
if (parentNode && plaintextParents[parentNode.localName]) {
return data;
}
return escapeData(data);
case Node.COMMENT_NODE:
return '<!--' + node.data + '-->';
default:
console.error(node);
throw new Error('not implemented');
}
}
function getInnerHTML(node, composed) {
if (node instanceof HTMLTemplateElement)
node = node.content;
var s = '';
var c$ = Polymer.dom(node).childNodes;
c$ = composed ? node._composedChildren : c$;
for (var i = 0, l = c$.length, child; i < l && (child = c$[i]); i++) {
s += getOuterHTML(child, node, composed);
}
return s;
}
return { getInnerHTML: getInnerHTML };
}();
Polymer.DomApi = function () {
'use strict';
var Settings = Polymer.Settings;
var getInnerHTML = Polymer.domInnerHTML.getInnerHTML;
var nativeInsertBefore = Element.prototype.insertBefore;
var nativeRemoveChild = Element.prototype.removeChild;
var nativeAppendChild = Element.prototype.appendChild;
var nativeCloneNode = Element.prototype.cloneNode;
var nativeImportNode = Document.prototype.importNode;
var DomApi = function (node) {
this.node = node;
if (this.patch) {
this.patch();
}
};
if (window.wrap && Settings.useShadow && !Settings.useNativeShadow) {
DomApi = function (node) {
this.node = wrap(node);
if (this.patch) {
this.patch();
}
};
}
DomApi.prototype = {
flush: function () {
Polymer.dom.flush();
},
_lazyDistribute: function (host) {
if (host.shadyRoot && host.shadyRoot._distributionClean) {
host.shadyRoot._distributionClean = false;
Polymer.dom.addDebouncer(host.debounce('_distribute', host._distributeContent));
}
},
appendChild: function (node) {
return this._addNode(node);
},
insertBefore: function (node, ref_node) {
return this._addNode(node, ref_node);
},
_addNode: function (node, ref_node) {
this._removeNodeFromHost(node, true);
var addedInsertionPoint;
var root = this.getOwnerRoot();
if (root) {
addedInsertionPoint = this._maybeAddInsertionPoint(node, this.node);
}
if (this._nodeHasLogicalChildren(this.node)) {
if (ref_node) {
var children = this.childNodes;
var index = children.indexOf(ref_node);
if (index < 0) {
throw Error('The ref_node to be inserted before is not a child ' + 'of this node');
}
}
this._addLogicalInfo(node, this.node, index);
}
this._addNodeToHost(node);
if (!this._maybeDistribute(node, this.node) && !this._tryRemoveUndistributedNode(node)) {
if (ref_node) {
ref_node = ref_node.localName === CONTENT ? this._firstComposedNode(ref_node) : ref_node;
}
var container = this.node._isShadyRoot ? this.node.host : this.node;
addToComposedParent(container, node, ref_node);
if (ref_node) {
nativeInsertBefore.call(container, node, ref_node);
} else {
nativeAppendChild.call(container, node);
}
}
if (addedInsertionPoint) {
this._updateInsertionPoints(root.host);
}
return node;
},
removeChild: function (node) {
if (factory(node).parentNode !== this.node) {
console.warn('The node to be removed is not a child of this node', node);
}
this._removeNodeFromHost(node);
if (!this._maybeDistribute(node, this.node)) {
var container = this.node._isShadyRoot ? this.node.host : this.node;
if (container === node.parentNode) {
removeFromComposedParent(container, node);
nativeRemoveChild.call(container, node);
}
}
return node;
},
replaceChild: function (node, ref_node) {
this.insertBefore(node, ref_node);
this.removeChild(ref_node);
return node;
},
_hasCachedOwnerRoot: function (node) {
return Boolean(node._ownerShadyRoot !== undefined);
},
getOwnerRoot: function () {
return this._ownerShadyRootForNode(this.node);
},
_ownerShadyRootForNode: function (node) {
if (!node) {
return;
}
if (node._ownerShadyRoot === undefined) {
var root;
if (node._isShadyRoot) {
root = node;
} else {
var parent = Polymer.dom(node).parentNode;
if (parent) {
root = parent._isShadyRoot ? parent : this._ownerShadyRootForNode(parent);
} else {
root = null;
}
}
node._ownerShadyRoot = root;
}
return node._ownerShadyRoot;
},
_maybeDistribute: function (node, parent) {
var fragContent = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noContent && Polymer.dom(node).querySelector(CONTENT);
var wrappedContent = fragContent && Polymer.dom(fragContent).parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE;
var hasContent = fragContent || node.localName === CONTENT;
if (hasContent) {
var root = this._ownerShadyRootForNode(parent);
if (root) {
var host = root.host;
this._lazyDistribute(host);
}
}
var parentNeedsDist = this._parentNeedsDistribution(parent);
if (parentNeedsDist) {
this._lazyDistribute(parent);
}
return parentNeedsDist || hasContent && !wrappedContent;
},
_maybeAddInsertionPoint: function (node, parent) {
var added;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noContent) {
var c$ = factory(node).querySelectorAll(CONTENT);
for (var i = 0, n, np, na; i < c$.length && (n = c$[i]); i++) {
np = factory(n).parentNode;
if (np === node) {
np = parent;
}
na = this._maybeAddInsertionPoint(n, np);
added = added || na;
}
} else if (node.localName === CONTENT) {
saveLightChildrenIfNeeded(parent);
saveLightChildrenIfNeeded(node);
added = true;
}
return added;
},
_tryRemoveUndistributedNode: function (node) {
if (this.node.shadyRoot) {
var parent = getComposedParent(node);
if (parent) {
nativeRemoveChild.call(parent, node);
}
return true;
}
},
_updateInsertionPoints: function (host) {
var i$ = host.shadyRoot._insertionPoints = factory(host.shadyRoot).querySelectorAll(CONTENT);
for (var i = 0, c; i < i$.length; i++) {
c = i$[i];
saveLightChildrenIfNeeded(c);
saveLightChildrenIfNeeded(factory(c).parentNode);
}
},
_nodeHasLogicalChildren: function (node) {
return Boolean(node._lightChildren !== undefined);
},
_parentNeedsDistribution: function (parent) {
return parent && parent.shadyRoot && hasInsertionPoint(parent.shadyRoot);
},
_removeNodeFromHost: function (node, ensureComposedRemoval) {
var hostNeedsDist;
var root;
var parent = node._lightParent;
if (parent) {
factory(node)._distributeParent();
root = this._ownerShadyRootForNode(node);
if (root) {
root.host._elementRemove(node);
hostNeedsDist = this._removeDistributedChildren(root, node);
}
this._removeLogicalInfo(node, node._lightParent);
}
this._removeOwnerShadyRoot(node);
if (root && hostNeedsDist) {
this._updateInsertionPoints(root.host);
this._lazyDistribute(root.host);
} else if (ensureComposedRemoval) {
removeFromComposedParent(getComposedParent(node), node);
}
},
_removeDistributedChildren: function (root, container) {
var hostNeedsDist;
var ip$ = root._insertionPoints;
for (var i = 0; i < ip$.length; i++) {
var content = ip$[i];
if (this._contains(container, content)) {
var dc$ = factory(content).getDistributedNodes();
for (var j = 0; j < dc$.length; j++) {
hostNeedsDist = true;
var node = dc$[j];
var parent = node.parentNode;
if (parent) {
removeFromComposedParent(parent, node);
nativeRemoveChild.call(parent, node);
}
}
}
}
return hostNeedsDist;
},
_contains: function (container, node) {
while (node) {
if (node == container) {
return true;
}
node = factory(node).parentNode;
}
},
_addNodeToHost: function (node) {
var root = this.getOwnerRoot();
if (root) {
root.host._elementAdd(node);
}
},
_addLogicalInfo: function (node, container, index) {
var children = factory(container).childNodes;
index = index === undefined ? children.length : index;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
var c$ = Array.prototype.slice.call(node.childNodes);
for (var i = 0, n; i < c$.length && (n = c$[i]); i++) {
children.splice(index++, 0, n);
n._lightParent = container;
}
} else {
children.splice(index, 0, node);
node._lightParent = container;
}
},
_removeLogicalInfo: function (node, container) {
var children = factory(container).childNodes;
var index = children.indexOf(node);
if (index < 0 || container !== node._lightParent) {
throw Error('The node to be removed is not a child of this node');
}
children.splice(index, 1);
node._lightParent = null;
},
_removeOwnerShadyRoot: function (node) {
if (this._hasCachedOwnerRoot(node)) {
var c$ = factory(node).childNodes;
for (var i = 0, l = c$.length, n; i < l && (n = c$[i]); i++) {
this._removeOwnerShadyRoot(n);
}
}
node._ownerShadyRoot = undefined;
},
_firstComposedNode: function (content) {
var n$ = factory(content).getDistributedNodes();
for (var i = 0, l = n$.length, n, p$; i < l && (n = n$[i]); i++) {
p$ = factory(n).getDestinationInsertionPoints();
if (p$[p$.length - 1] === content) {
return n;
}
}
},
querySelector: function (selector) {
return this.querySelectorAll(selector)[0];
},
querySelectorAll: function (selector) {
return this._query(function (n) {
return matchesSelector.call(n, selector);
}, this.node);
},
_query: function (matcher, node) {
node = node || this.node;
var list = [];
this._queryElements(factory(node).childNodes, matcher, list);
return list;
},
_queryElements: function (elements, matcher, list) {
for (var i = 0, l = elements.length, c; i < l && (c = elements[i]); i++) {
if (c.nodeType === Node.ELEMENT_NODE) {
this._queryElement(c, matcher, list);
}
}
},
_queryElement: function (node, matcher, list) {
if (matcher(node)) {
list.push(node);
}
this._queryElements(factory(node).childNodes, matcher, list);
},
getDestinationInsertionPoints: function () {
return this.node._destinationInsertionPoints || [];
},
getDistributedNodes: function () {
return this.node._distributedNodes || [];
},
queryDistributedElements: function (selector) {
var c$ = this.childNodes;
var list = [];
this._distributedFilter(selector, c$, list);
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.localName === CONTENT) {
this._distributedFilter(selector, factory(c).getDistributedNodes(), list);
}
}
return list;
},
_distributedFilter: function (selector, list, results) {
results = results || [];
for (var i = 0, l = list.length, d; i < l && (d = list[i]); i++) {
if (d.nodeType === Node.ELEMENT_NODE && d.localName !== CONTENT && matchesSelector.call(d, selector)) {
results.push(d);
}
}
return results;
},
_clear: function () {
while (this.childNodes.length) {
this.removeChild(this.childNodes[0]);
}
},
setAttribute: function (name, value) {
this.node.setAttribute(name, value);
this._distributeParent();
},
removeAttribute: function (name) {
this.node.removeAttribute(name);
this._distributeParent();
},
_distributeParent: function () {
if (this._parentNeedsDistribution(this.parentNode)) {
this._lazyDistribute(this.parentNode);
}
},
cloneNode: function (deep) {
var n = nativeCloneNode.call(this.node, false);
if (deep) {
var c$ = this.childNodes;
var d = factory(n);
for (var i = 0, nc; i < c$.length; i++) {
nc = factory(c$[i]).cloneNode(true);
d.appendChild(nc);
}
}
return n;
},
importNode: function (externalNode, deep) {
var doc = this.node instanceof Document ? this.node : this.node.ownerDocument;
var n = nativeImportNode.call(doc, externalNode, false);
if (deep) {
var c$ = factory(externalNode).childNodes;
var d = factory(n);
for (var i = 0, nc; i < c$.length; i++) {
nc = factory(doc).importNode(c$[i], true);
d.appendChild(nc);
}
}
return n;
}
};
Object.defineProperty(DomApi.prototype, 'classList', {
get: function () {
if (!this._classList) {
this._classList = new DomApi.ClassList(this);
}
return this._classList;
},
configurable: true
});
DomApi.ClassList = function (host) {
this.domApi = host;
this.node = host.node;
};
DomApi.ClassList.prototype = {
add: function () {
this.node.classList.add.apply(this.node.classList, arguments);
this.domApi._distributeParent();
},
remove: function () {
this.node.classList.remove.apply(this.node.classList, arguments);
this.domApi._distributeParent();
},
toggle: function () {
this.node.classList.toggle.apply(this.node.classList, arguments);
this.domApi._distributeParent();
},
contains: function () {
return this.node.classList.contains.apply(this.node.classList, arguments);
}
};
if (!Settings.useShadow) {
Object.defineProperties(DomApi.prototype, {
childNodes: {
get: function () {
var c$ = getLightChildren(this.node);
return Array.isArray(c$) ? c$ : Array.prototype.slice.call(c$);
},
configurable: true
},
children: {
get: function () {
return Array.prototype.filter.call(this.childNodes, function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
},
configurable: true
},
parentNode: {
get: function () {
return this.node._lightParent || getComposedParent(this.node);
},
configurable: true
},
firstChild: {
get: function () {
return this.childNodes[0];
},
configurable: true
},
lastChild: {
get: function () {
var c$ = this.childNodes;
return c$[c$.length - 1];
},
configurable: true
},
nextSibling: {
get: function () {
var c$ = this.parentNode && factory(this.parentNode).childNodes;
if (c$) {
return c$[Array.prototype.indexOf.call(c$, this.node) + 1];
}
},
configurable: true
},
previousSibling: {
get: function () {
var c$ = this.parentNode && factory(this.parentNode).childNodes;
if (c$) {
return c$[Array.prototype.indexOf.call(c$, this.node) - 1];
}
},
configurable: true
},
firstElementChild: {
get: function () {
return this.children[0];
},
configurable: true
},
lastElementChild: {
get: function () {
var c$ = this.children;
return c$[c$.length - 1];
},
configurable: true
},
nextElementSibling: {
get: function () {
var c$ = this.parentNode && factory(this.parentNode).children;
if (c$) {
return c$[Array.prototype.indexOf.call(c$, this.node) + 1];
}
},
configurable: true
},
previousElementSibling: {
get: function () {
var c$ = this.parentNode && factory(this.parentNode).children;
if (c$) {
return c$[Array.prototype.indexOf.call(c$, this.node) - 1];
}
},
configurable: true
},
textContent: {
get: function () {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
return this.node.textContent;
} else {
var tc = [];
for (var i = 0, cn = this.childNodes, c; c = cn[i]; i++) {
if (c.nodeType !== Node.COMMENT_NODE) {
tc.push(c.textContent);
}
}
return tc.join('');
}
},
set: function (text) {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
this.node.textContent = text;
} else {
this._clear();
if (text) {
this.appendChild(document.createTextNode(text));
}
}
},
configurable: true
},
innerHTML: {
get: function () {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
return null;
} else {
return getInnerHTML(this.node);
}
},
set: function (text) {
var nt = this.node.nodeType;
if (nt !== Node.TEXT_NODE || nt !== Node.COMMENT_NODE) {
this._clear();
var d = document.createElement('div');
d.innerHTML = text;
var c$ = Array.prototype.slice.call(d.childNodes);
for (var i = 0; i < c$.length; i++) {
this.appendChild(c$[i]);
}
}
},
configurable: true
}
});
DomApi.prototype._getComposedInnerHTML = function () {
return getInnerHTML(this.node, true);
};
} else {
var forwardMethods = [
'cloneNode',
'appendChild',
'insertBefore',
'removeChild',
'replaceChild'
];
forwardMethods.forEach(function (name) {
DomApi.prototype[name] = function () {
return this.node[name].apply(this.node, arguments);
};
});
DomApi.prototype.querySelectorAll = function (selector) {
return Array.prototype.slice.call(this.node.querySelectorAll(selector));
};
DomApi.prototype.getOwnerRoot = function () {
var n = this.node;
while (n) {
if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE && n.host) {
return n;
}
n = n.parentNode;
}
};
DomApi.prototype.importNode = function (externalNode, deep) {
var doc = this.node instanceof Document ? this.node : this.node.ownerDocument;
return doc.importNode(externalNode, deep);
};
DomApi.prototype.getDestinationInsertionPoints = function () {
var n$ = this.node.getDestinationInsertionPoints && this.node.getDestinationInsertionPoints();
return n$ ? Array.prototype.slice.call(n$) : [];
};
DomApi.prototype.getDistributedNodes = function () {
var n$ = this.node.getDistributedNodes && this.node.getDistributedNodes();
return n$ ? Array.prototype.slice.call(n$) : [];
};
DomApi.prototype._distributeParent = function () {
};
Object.defineProperties(DomApi.prototype, {
childNodes: {
get: function () {
return Array.prototype.slice.call(this.node.childNodes);
},
configurable: true
},
children: {
get: function () {
return Array.prototype.slice.call(this.node.children);
},
configurable: true
},
textContent: {
get: function () {
return this.node.textContent;
},
set: function (value) {
return this.node.textContent = value;
},
configurable: true
},
innerHTML: {
get: function () {
return this.node.innerHTML;
},
set: function (value) {
return this.node.innerHTML = value;
},
configurable: true
}
});
var forwardProperties = [
'parentNode',
'firstChild',
'lastChild',
'nextSibling',
'previousSibling',
'firstElementChild',
'lastElementChild',
'nextElementSibling',
'previousElementSibling'
];
forwardProperties.forEach(function (name) {
Object.defineProperty(DomApi.prototype, name, {
get: function () {
return this.node[name];
},
configurable: true
});
});
}
var CONTENT = 'content';
var factory = function (node, patch) {
node = node || document;
if (!node.__domApi) {
node.__domApi = new DomApi(node, patch);
}
return node.__domApi;
};
Polymer.dom = function (obj, patch) {
if (obj instanceof Event) {
return Polymer.EventApi.factory(obj);
} else {
return factory(obj, patch);
}
};
Polymer.Base.extend(Polymer.dom, {
_flushGuard: 0,
_FLUSH_MAX: 100,
_needsTakeRecords: !Polymer.Settings.useNativeCustomElements,
_debouncers: [],
_finishDebouncer: null,
flush: function () {
for (var i = 0; i < this._debouncers.length; i++) {
this._debouncers[i].complete();
}
if (this._finishDebouncer) {
this._finishDebouncer.complete();
}
this._flushPolyfills();
if (this._debouncers.length && this._flushGuard < this._FLUSH_MAX) {
this._flushGuard++;
this.flush();
} else {
if (this._flushGuard >= this._FLUSH_MAX) {
console.warn('Polymer.dom.flush aborted. Flush may not be complete.');
}
this._flushGuard = 0;
}
},
_flushPolyfills: function () {
if (this._needsTakeRecords) {
CustomElements.takeRecords();
}
},
addDebouncer: function (debouncer) {
this._debouncers.push(debouncer);
this._finishDebouncer = Polymer.Debounce(this._finishDebouncer, this._finishFlush);
},
_finishFlush: function () {
Polymer.dom._debouncers = [];
}
});
function getLightChildren(node) {
var children = node._lightChildren;
return children ? children : node.childNodes;
}
function getComposedChildren(node) {
if (!node._composedChildren) {
node._composedChildren = Array.prototype.slice.call(node.childNodes);
}
return node._composedChildren;
}
function addToComposedParent(parent, node, ref_node) {
var children = getComposedChildren(parent);
var i = ref_node ? children.indexOf(ref_node) : -1;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
var fragChildren = getComposedChildren(node);
for (var j = 0; j < fragChildren.length; j++) {
addNodeToComposedChildren(fragChildren[j], parent, children, i + j);
}
node._composedChildren = null;
} else {
addNodeToComposedChildren(node, parent, children, i);
}
}
function getComposedParent(node) {
return node.__patched ? node._composedParent : node.parentNode;
}
function addNodeToComposedChildren(node, parent, children, i) {
node._composedParent = parent;
children.splice(i >= 0 ? i : children.length, 0, node);
}
function removeFromComposedParent(parent, node) {
node._composedParent = null;
if (parent) {
var children = getComposedChildren(parent);
var i = children.indexOf(node);
if (i >= 0) {
children.splice(i, 1);
}
}
}
function saveLightChildrenIfNeeded(node) {
if (!node._lightChildren) {
var c$ = Array.prototype.slice.call(node.childNodes);
for (var i = 0, l = c$.length, child; i < l && (child = c$[i]); i++) {
child._lightParent = child._lightParent || node;
}
node._lightChildren = c$;
}
}
function hasInsertionPoint(root) {
return Boolean(root && root._insertionPoints.length);
}
var p = Element.prototype;
var matchesSelector = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
return {
getLightChildren: getLightChildren,
getComposedParent: getComposedParent,
getComposedChildren: getComposedChildren,
removeFromComposedParent: removeFromComposedParent,
saveLightChildrenIfNeeded: saveLightChildrenIfNeeded,
matchesSelector: matchesSelector,
hasInsertionPoint: hasInsertionPoint,
ctor: DomApi,
factory: factory
};
}();
(function () {
Polymer.Base._addFeature({
_prepShady: function () {
this._useContent = this._useContent || Boolean(this._template);
},
_poolContent: function () {
if (this._useContent) {
saveLightChildrenIfNeeded(this);
}
},
_setupRoot: function () {
if (this._useContent) {
this._createLocalRoot();
if (!this.dataHost) {
upgradeLightChildren(this._lightChildren);
}
}
},
_createLocalRoot: function () {
this.shadyRoot = this.root;
this.shadyRoot._distributionClean = false;
this.shadyRoot._isShadyRoot = true;
this.shadyRoot._dirtyRoots = [];
var i$ = this.shadyRoot._insertionPoints = !this._notes || this._notes._hasContent ? this.shadyRoot.querySelectorAll('content') : [];
saveLightChildrenIfNeeded(this.shadyRoot);
for (var i = 0, c; i < i$.length; i++) {
c = i$[i];
saveLightChildrenIfNeeded(c);
saveLightChildrenIfNeeded(c.parentNode);
}
this.shadyRoot.host = this;
},
get domHost() {
var root = Polymer.dom(this).getOwnerRoot();
return root && root.host;
},
distributeContent: function (updateInsertionPoints) {
if (this.shadyRoot) {
var dom = Polymer.dom(this);
if (updateInsertionPoints) {
dom._updateInsertionPoints(this);
}
var host = getTopDistributingHost(this);
dom._lazyDistribute(host);
}
},
_distributeContent: function () {
if (this._useContent && !this.shadyRoot._distributionClean) {
this._beginDistribute();
this._distributeDirtyRoots();
this._finishDistribute();
}
},
_beginDistribute: function () {
if (this._useContent && hasInsertionPoint(this.shadyRoot)) {
this._resetDistribution();
this._distributePool(this.shadyRoot, this._collectPool());
}
},
_distributeDirtyRoots: function () {
var c$ = this.shadyRoot._dirtyRoots;
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
c._distributeContent();
}
this.shadyRoot._dirtyRoots = [];
},
_finishDistribute: function () {
if (this._useContent) {
this.shadyRoot._distributionClean = true;
if (hasInsertionPoint(this.shadyRoot)) {
this._composeTree();
} else {
if (!this.shadyRoot._hasDistributed) {
this.textContent = '';
this._composedChildren = null;
this.appendChild(this.shadyRoot);
} else {
var children = this._composeNode(this);
this._updateChildNodes(this, children);
}
}
this.shadyRoot._hasDistributed = true;
}
},
elementMatches: function (selector, node) {
node = node || this;
return matchesSelector.call(node, selector);
},
_resetDistribution: function () {
var children = getLightChildren(this);
for (var i = 0; i < children.length; i++) {
var child = children[i];
if (child._destinationInsertionPoints) {
child._destinationInsertionPoints = undefined;
}
if (isInsertionPoint(child)) {
clearDistributedDestinationInsertionPoints(child);
}
}
var root = this.shadyRoot;
var p$ = root._insertionPoints;
for (var j = 0; j < p$.length; j++) {
p$[j]._distributedNodes = [];
}
},
_collectPool: function () {
var pool = [];
var children = getLightChildren(this);
for (var i = 0; i < children.length; i++) {
var child = children[i];
if (isInsertionPoint(child)) {
pool.push.apply(pool, child._distributedNodes);
} else {
pool.push(child);
}
}
return pool;
},
_distributePool: function (node, pool) {
var p$ = node._insertionPoints;
for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
this._distributeInsertionPoint(p, pool);
maybeRedistributeParent(p, this);
}
},
_distributeInsertionPoint: function (content, pool) {
var anyDistributed = false;
for (var i = 0, l = pool.length, node; i < l; i++) {
node = pool[i];
if (!node) {
continue;
}
if (this._matchesContentSelect(node, content)) {
distributeNodeInto(node, content);
pool[i] = undefined;
anyDistributed = true;
}
}
if (!anyDistributed) {
var children = getLightChildren(content);
for (var j = 0; j < children.length; j++) {
distributeNodeInto(children[j], content);
}
}
},
_composeTree: function () {
this._updateChildNodes(this, this._composeNode(this));
var p$ = this.shadyRoot._insertionPoints;
for (var i = 0, l = p$.length, p, parent; i < l && (p = p$[i]); i++) {
parent = p._lightParent || p.parentNode;
if (!parent._useContent && parent !== this && parent !== this.shadyRoot) {
this._updateChildNodes(parent, this._composeNode(parent));
}
}
},
_composeNode: function (node) {
var children = [];
var c$ = getLightChildren(node.shadyRoot || node);
for (var i = 0; i < c$.length; i++) {
var child = c$[i];
if (isInsertionPoint(child)) {
var distributedNodes = child._distributedNodes;
for (var j = 0; j < distributedNodes.length; j++) {
var distributedNode = distributedNodes[j];
if (isFinalDestination(child, distributedNode)) {
children.push(distributedNode);
}
}
} else {
children.push(child);
}
}
return children;
},
_updateChildNodes: function (container, children) {
var composed = getComposedChildren(container);
var splices = Polymer.ArraySplice.calculateSplices(children, composed);
for (var i = 0, d = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0, n; j < s.removed.length && (n = s.removed[j]); j++) {
if (getComposedParent(n) === container) {
remove(n);
}
composed.splice(s.index + d, 1);
}
d -= s.addedCount;
}
for (var i = 0, s, next; i < splices.length && (s = splices[i]); i++) {
next = composed[s.index];
for (var j = s.index, n; j < s.index + s.addedCount; j++) {
n = children[j];
insertBefore(container, n, next);
composed.splice(j, 0, n);
}
}
ensureComposedParent(container, children);
},
_matchesContentSelect: function (node, contentElement) {
var select = contentElement.getAttribute('select');
if (!select) {
return true;
}
select = select.trim();
if (!select) {
return true;
}
if (!(node instanceof Element)) {
return false;
}
var validSelectors = /^(:not\()?[*.#[a-zA-Z_|]/;
if (!validSelectors.test(select)) {
return false;
}
return this.elementMatches(select, node);
},
_elementAdd: function () {
},
_elementRemove: function () {
}
});
var saveLightChildrenIfNeeded = Polymer.DomApi.saveLightChildrenIfNeeded;
var getLightChildren = Polymer.DomApi.getLightChildren;
var matchesSelector = Polymer.DomApi.matchesSelector;
var hasInsertionPoint = Polymer.DomApi.hasInsertionPoint;
var getComposedChildren = Polymer.DomApi.getComposedChildren;
var getComposedParent = Polymer.DomApi.getComposedParent;
var removeFromComposedParent = Polymer.DomApi.removeFromComposedParent;
function distributeNodeInto(child, insertionPoint) {
insertionPoint._distributedNodes.push(child);
var points = child._destinationInsertionPoints;
if (!points) {
child._destinationInsertionPoints = [insertionPoint];
} else {
points.push(insertionPoint);
}
}
function clearDistributedDestinationInsertionPoints(content) {
var e$ = content._distributedNodes;
if (e$) {
for (var i = 0; i < e$.length; i++) {
var d = e$[i]._destinationInsertionPoints;
if (d) {
d.splice(d.indexOf(content) + 1, d.length);
}
}
}
}
function maybeRedistributeParent(content, host) {
var parent = content._lightParent;
if (parent && parent.shadyRoot && hasInsertionPoint(parent.shadyRoot) && parent.shadyRoot._distributionClean) {
parent.shadyRoot._distributionClean = false;
host.shadyRoot._dirtyRoots.push(parent);
}
}
function isFinalDestination(insertionPoint, node) {
var points = node._destinationInsertionPoints;
return points && points[points.length - 1] === insertionPoint;
}
function isInsertionPoint(node) {
return node.localName == 'content';
}
var nativeInsertBefore = Element.prototype.insertBefore;
var nativeRemoveChild = Element.prototype.removeChild;
function insertBefore(parentNode, newChild, refChild) {
var newChildParent = getComposedParent(newChild);
if (newChildParent !== parentNode) {
removeFromComposedParent(newChildParent, newChild);
}
remove(newChild);
nativeInsertBefore.call(parentNode, newChild, refChild || null);
newChild._composedParent = parentNode;
}
function remove(node) {
var parentNode = getComposedParent(node);
if (parentNode) {
node._composedParent = null;
nativeRemoveChild.call(parentNode, node);
}
}
function ensureComposedParent(parent, children) {
for (var i = 0, n; i < children.length; i++) {
children[i]._composedParent = parent;
}
}
function getTopDistributingHost(host) {
while (host && hostNeedsRedistribution(host)) {
host = host.domHost;
}
return host;
}
function hostNeedsRedistribution(host) {
var c$ = Polymer.dom(host).children;
for (var i = 0, c; i < c$.length; i++) {
c = c$[i];
if (c.localName === 'content') {
return host.domHost;
}
}
}
var needsUpgrade = window.CustomElements && !CustomElements.useNative;
function upgradeLightChildren(children) {
if (needsUpgrade && children) {
for (var i = 0; i < children.length; i++) {
CustomElements.upgrade(children[i]);
}
}
}
}());
if (Polymer.Settings.useShadow) {
Polymer.Base._addFeature({
_poolContent: function () {
},
_beginDistribute: function () {
},
distributeContent: function () {
},
_distributeContent: function () {
},
_finishDistribute: function () {
},
_createLocalRoot: function () {
this.createShadowRoot();
this.shadowRoot.appendChild(this.root);
this.root = this.shadowRoot;
}
});
}
Polymer.DomModule = document.createElement('dom-module');
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepAttributes();
this._prepBehaviors();
this._prepConstructor();
this._prepTemplate();
this._prepShady();
},
_prepBehavior: function (b) {
this._addHostAttributes(b.hostAttributes);
},
_initFeatures: function () {
this._poolContent();
this._pushHost();
this._stampTemplate();
this._popHost();
this._marshalHostAttributes();
this._setupDebouncers();
this._marshalBehaviors();
this._tryReady();
},
_marshalBehavior: function (b) {
}
});
;Polymer.nar = [];
Polymer.Annotations = {
parseAnnotations: function (template) {
var list = [];
var content = template._content || template.content;
this._parseNodeAnnotations(content, list);
return list;
},
_parseNodeAnnotations: function (node, list) {
return node.nodeType === Node.TEXT_NODE ? this._parseTextNodeAnnotation(node, list) : this._parseElementAnnotations(node, list);
},
_testEscape: function (value) {
var escape = value.slice(0, 2);
if (escape === '{{' || escape === '[[') {
return escape;
}
},
_parseTextNodeAnnotation: function (node, list) {
var v = node.textContent;
var escape = this._testEscape(v);
if (escape) {
node.textContent = ' ';
var annote = {
bindings: [{
kind: 'text',
mode: escape[0],
value: v.slice(2, -2).trim()
}]
};
list.push(annote);
return annote;
}
},
_parseElementAnnotations: function (element, list) {
var annote = {
bindings: [],
events: []
};
if (element.localName === 'content') {
list._hasContent = true;
}
this._parseChildNodesAnnotations(element, annote, list);
if (element.attributes) {
this._parseNodeAttributeAnnotations(element, annote, list);
if (this.prepElement) {
this.prepElement(element);
}
}
if (annote.bindings.length || annote.events.length || annote.id) {
list.push(annote);
}
return annote;
},
_parseChildNodesAnnotations: function (root, annote, list, callback) {
if (root.firstChild) {
for (var i = 0, node = root.firstChild; node; node = node.nextSibling, i++) {
if (node.localName === 'template' && !node.hasAttribute('preserve-content')) {
this._parseTemplate(node, i, list, annote);
}
if (node.nodeType === Node.TEXT_NODE) {
var n = node.nextSibling;
while (n && n.nodeType === Node.TEXT_NODE) {
node.textContent += n.textContent;
root.removeChild(n);
n = n.nextSibling;
}
}
var childAnnotation = this._parseNodeAnnotations(node, list, callback);
if (childAnnotation) {
childAnnotation.parent = annote;
childAnnotation.index = i;
}
}
}
},
_parseTemplate: function (node, index, list, parent) {
var content = document.createDocumentFragment();
content._notes = this.parseAnnotations(node);
content.appendChild(node.content);
list.push({
bindings: Polymer.nar,
events: Polymer.nar,
templateContent: content,
parent: parent,
index: index
});
},
_parseNodeAttributeAnnotations: function (node, annotation) {
for (var i = node.attributes.length - 1, a; a = node.attributes[i]; i--) {
var n = a.name, v = a.value;
if (n === 'id' && !this._testEscape(v)) {
annotation.id = v;
} else if (n.slice(0, 3) === 'on-') {
node.removeAttribute(n);
annotation.events.push({
name: n.slice(3),
value: v
});
} else {
var b = this._parseNodeAttributeAnnotation(node, n, v);
if (b) {
annotation.bindings.push(b);
}
}
}
},
_parseNodeAttributeAnnotation: function (node, n, v) {
var escape = this._testEscape(v);
if (escape) {
var customEvent;
var name = n;
var mode = escape[0];
v = v.slice(2, -2).trim();
var not = false;
if (v[0] == '!') {
v = v.substring(1);
not = true;
}
var kind = 'property';
if (n[n.length - 1] == '$') {
name = n.slice(0, -1);
kind = 'attribute';
}
var notifyEvent, colon;
if (mode == '{' && (colon = v.indexOf('::')) > 0) {
notifyEvent = v.substring(colon + 2);
v = v.substring(0, colon);
customEvent = true;
}
if (node.localName == 'input' && n == 'value') {
node.setAttribute(n, '');
}
node.removeAttribute(n);
if (kind === 'property') {
name = Polymer.CaseMap.dashToCamelCase(name);
}
return {
kind: kind,
mode: mode,
name: name,
value: v,
negate: not,
event: notifyEvent,
customEvent: customEvent
};
}
},
_localSubTree: function (node, host) {
return node === host ? node.childNodes : node._lightChildren || node.childNodes;
},
findAnnotatedNode: function (root, annote) {
var parent = annote.parent && Polymer.Annotations.findAnnotatedNode(root, annote.parent);
return !parent ? root : Polymer.Annotations._localSubTree(parent, root)[annote.index];
}
};
(function () {
function resolveCss(cssText, ownerDocument) {
return cssText.replace(CSS_URL_RX, function (m, pre, url, post) {
return pre + '\'' + resolve(url.replace(/["']/g, ''), ownerDocument) + '\'' + post;
});
}
function resolveAttrs(element, ownerDocument) {
for (var name in URL_ATTRS) {
var a$ = URL_ATTRS[name];
for (var i = 0, l = a$.length, a, at, v; i < l && (a = a$[i]); i++) {
if (name === '*' || element.localName === name) {
at = element.attributes[a];
v = at && at.value;
if (v && v.search(BINDING_RX) < 0) {
at.value = a === 'style' ? resolveCss(v, ownerDocument) : resolve(v, ownerDocument);
}
}
}
}
}
function resolve(url, ownerDocument) {
if (url && url[0] === '#') {
return url;
}
var resolver = getUrlResolver(ownerDocument);
resolver.href = url;
return resolver.href || url;
}
var tempDoc;
var tempDocBase;
function resolveUrl(url, baseUri) {
if (!tempDoc) {
tempDoc = document.implementation.createHTMLDocument('temp');
tempDocBase = tempDoc.createElement('base');
tempDoc.head.appendChild(tempDocBase);
}
tempDocBase.href = baseUri;
return resolve(url, tempDoc);
}
function getUrlResolver(ownerDocument) {
return ownerDocument.__urlResolver || (ownerDocument.__urlResolver = ownerDocument.createElement('a'));
}
var CSS_URL_RX = /(url\()([^)]*)(\))/g;
var URL_ATTRS = {
'*': [
'href',
'src',
'style',
'url'
],
form: ['action']
};
var BINDING_RX = /\{\{|\[\[/;
Polymer.ResolveUrl = {
resolveCss: resolveCss,
resolveAttrs: resolveAttrs,
resolveUrl: resolveUrl
};
}());
Polymer.Base._addFeature({
_prepAnnotations: function () {
if (!this._template) {
this._notes = [];
} else {
Polymer.Annotations.prepElement = this._prepElement.bind(this);
if (this._template._content && this._template._content._notes) {
this._notes = this._template._content._notes;
} else {
this._notes = Polymer.Annotations.parseAnnotations(this._template);
}
this._processAnnotations(this._notes);
Polymer.Annotations.prepElement = null;
}
},
_processAnnotations: function (notes) {
for (var i = 0; i < notes.length; i++) {
var note = notes[i];
for (var j = 0; j < note.bindings.length; j++) {
var b = note.bindings[j];
b.signature = this._parseMethod(b.value);
if (!b.signature) {
b.model = this._modelForPath(b.value);
}
}
if (note.templateContent) {
this._processAnnotations(note.templateContent._notes);
var pp = note.templateContent._parentProps = this._discoverTemplateParentProps(note.templateContent._notes);
var bindings = [];
for (var prop in pp) {
bindings.push({
index: note.index,
kind: 'property',
mode: '{',
name: '_parent_' + prop,
model: prop,
value: prop
});
}
note.bindings = note.bindings.concat(bindings);
}
}
},
_discoverTemplateParentProps: function (notes) {
var pp = {};
notes.forEach(function (n) {
n.bindings.forEach(function (b) {
if (b.signature) {
var args = b.signature.args;
for (var k = 0; k < args.length; k++) {
pp[args[k].model] = true;
}
} else {
pp[b.model] = true;
}
});
if (n.templateContent) {
var tpp = n.templateContent._parentProps;
Polymer.Base.mixin(pp, tpp);
}
});
return pp;
},
_prepElement: function (element) {
Polymer.ResolveUrl.resolveAttrs(element, this._template.ownerDocument);
},
_findAnnotatedNode: Polymer.Annotations.findAnnotatedNode,
_marshalAnnotationReferences: function () {
if (this._template) {
this._marshalIdNodes();
this._marshalAnnotatedNodes();
this._marshalAnnotatedListeners();
}
},
_configureAnnotationReferences: function () {
this._configureTemplateContent();
},
_configureTemplateContent: function () {
this._notes.forEach(function (note, i) {
if (note.templateContent) {
this._nodes[i]._content = note.templateContent;
}
}, this);
},
_marshalIdNodes: function () {
this.$ = {};
this._notes.forEach(function (a) {
if (a.id) {
this.$[a.id] = this._findAnnotatedNode(this.root, a);
}
}, this);
},
_marshalAnnotatedNodes: function () {
if (this._nodes) {
this._nodes = this._nodes.map(function (a) {
return this._findAnnotatedNode(this.root, a);
}, this);
}
},
_marshalAnnotatedListeners: function () {
this._notes.forEach(function (a) {
if (a.events && a.events.length) {
var node = this._findAnnotatedNode(this.root, a);
a.events.forEach(function (e) {
this.listen(node, e.name, e.value);
}, this);
}
}, this);
}
});
Polymer.Base._addFeature({
listeners: {},
_listenListeners: function (listeners) {
var node, name, key;
for (key in listeners) {
if (key.indexOf('.') < 0) {
node = this;
name = key;
} else {
name = key.split('.');
node = this.$[name[0]];
name = name[1];
}
this.listen(node, name, listeners[key]);
}
},
listen: function (node, eventName, methodName) {
this._listen(node, eventName, this._createEventHandler(node, eventName, methodName));
},
_boundListenerKey: function (eventName, methodName) {
return eventName + ':' + methodName;
},
_recordEventHandler: function (host, eventName, target, methodName, handler) {
var hbl = host.__boundListeners;
if (!hbl) {
hbl = host.__boundListeners = new WeakMap();
}
var bl = hbl.get(target);
if (!bl) {
bl = {};
hbl.set(target, bl);
}
var key = this._boundListenerKey(eventName, methodName);
bl[key] = handler;
},
_recallEventHandler: function (host, eventName, target, methodName) {
var hbl = host.__boundListeners;
if (!hbl) {
return;
}
var bl = hbl.get(target);
if (!bl) {
return;
}
var key = this._boundListenerKey(eventName, methodName);
return bl[key];
},
_createEventHandler: function (node, eventName, methodName) {
var host = this;
var handler = function (e) {
if (host[methodName]) {
host[methodName](e, e.detail);
} else {
host._warn(host._logf('_createEventHandler', 'listener method `' + methodName + '` not defined'));
}
};
this._recordEventHandler(host, eventName, node, methodName, handler);
return handler;
},
unlisten: function (node, eventName, methodName) {
var handler = this._recallEventHandler(this, eventName, node, methodName);
if (handler) {
this._unlisten(node, eventName, handler);
}
},
_listen: function (node, eventName, handler) {
node.addEventListener(eventName, handler);
},
_unlisten: function (node, eventName, handler) {
node.removeEventListener(eventName, handler);
}
});
(function () {
'use strict';
var HAS_NATIVE_TA = typeof document.head.style.touchAction === 'string';
var GESTURE_KEY = '__polymerGestures';
var HANDLED_OBJ = '__polymerGesturesHandled';
var TOUCH_ACTION = '__polymerGesturesTouchAction';
var TAP_DISTANCE = 25;
var TRACK_DISTANCE = 5;
var TRACK_LENGTH = 2;
var MOUSE_TIMEOUT = 2500;
var MOUSE_EVENTS = [
'mousedown',
'mousemove',
'mouseup',
'click'
];
var MOUSE_WHICH_TO_BUTTONS = [
0,
1,
4,
2
];
var MOUSE_HAS_BUTTONS = function () {
try {
return new MouseEvent('test', { buttons: 1 }).buttons === 1;
} catch (e) {
return false;
}
}();
var IS_TOUCH_ONLY = navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);
var mouseCanceller = function (mouseEvent) {
mouseEvent[HANDLED_OBJ] = { skip: true };
if (mouseEvent.type === 'click') {
var path = Polymer.dom(mouseEvent).path;
for (var i = 0; i < path.length; i++) {
if (path[i] === POINTERSTATE.mouse.target) {
return;
}
}
mouseEvent.preventDefault();
mouseEvent.stopPropagation();
}
};
function setupTeardownMouseCanceller(setup) {
for (var i = 0, en; i < MOUSE_EVENTS.length; i++) {
en = MOUSE_EVENTS[i];
if (setup) {
document.addEventListener(en, mouseCanceller, true);
} else {
document.removeEventListener(en, mouseCanceller, true);
}
}
}
function ignoreMouse() {
if (IS_TOUCH_ONLY) {
return;
}
if (!POINTERSTATE.mouse.mouseIgnoreJob) {
setupTeardownMouseCanceller(true);
}
var unset = function () {
setupTeardownMouseCanceller();
POINTERSTATE.mouse.target = null;
POINTERSTATE.mouse.mouseIgnoreJob = null;
};
POINTERSTATE.mouse.mouseIgnoreJob = Polymer.Debounce(POINTERSTATE.mouse.mouseIgnoreJob, unset, MOUSE_TIMEOUT);
}
function hasLeftMouseButton(ev) {
var type = ev.type;
if (MOUSE_EVENTS.indexOf(type) === -1) {
return false;
}
if (type === 'mousemove') {
var buttons = ev.buttons === undefined ? 1 : ev.buttons;
if (ev instanceof window.MouseEvent && !MOUSE_HAS_BUTTONS) {
buttons = MOUSE_WHICH_TO_BUTTONS[ev.which] || 0;
}
return Boolean(buttons & 1);
} else {
var button = ev.button === undefined ? 0 : ev.button;
return button === 0;
}
}
function isSyntheticClick(ev) {
if (ev.type === 'click') {
if (ev.detail === 0) {
return true;
}
var t = Gestures.findOriginalTarget(ev);
var bcr = t.getBoundingClientRect();
var x = ev.pageX, y = ev.pageY;
return !(x >= bcr.left && x <= bcr.right && (y >= bcr.top && y <= bcr.bottom));
}
return false;
}
var POINTERSTATE = {
mouse: {
target: null,
mouseIgnoreJob: null
},
touch: {
x: 0,
y: 0,
id: -1,
scrollDecided: false
}
};
function firstTouchAction(ev) {
var path = Polymer.dom(ev).path;
var ta = 'auto';
for (var i = 0, n; i < path.length; i++) {
n = path[i];
if (n[TOUCH_ACTION]) {
ta = n[TOUCH_ACTION];
break;
}
}
return ta;
}
function trackDocument(stateObj, movefn, upfn) {
stateObj.movefn = movefn;
stateObj.upfn = upfn;
document.addEventListener('mousemove', movefn);
document.addEventListener('mouseup', upfn);
}
function untrackDocument(stateObj) {
document.removeEventListener('mousemove', stateObj.movefn);
document.removeEventListener('mouseup', stateObj.upfn);
}
var Gestures = {
gestures: {},
recognizers: [],
deepTargetFind: function (x, y) {
var node = document.elementFromPoint(x, y);
var next = node;
while (next && next.shadowRoot) {
next = next.shadowRoot.elementFromPoint(x, y);
if (next) {
node = next;
}
}
return node;
},
findOriginalTarget: function (ev) {
if (ev.path) {
return ev.path[0];
}
return ev.target;
},
handleNative: function (ev) {
var handled;
var type = ev.type;
var node = ev.currentTarget;
var gobj = node[GESTURE_KEY];
var gs = gobj[type];
if (!gs) {
return;
}
if (!ev[HANDLED_OBJ]) {
ev[HANDLED_OBJ] = {};
if (type.slice(0, 5) === 'touch') {
var t = ev.changedTouches[0];
if (type === 'touchstart') {
if (ev.touches.length === 1) {
POINTERSTATE.touch.id = t.identifier;
}
}
if (POINTERSTATE.touch.id !== t.identifier) {
return;
}
if (!HAS_NATIVE_TA) {
if (type === 'touchstart' || type === 'touchmove') {
Gestures.handleTouchAction(ev);
}
}
if (type === 'touchend') {
POINTERSTATE.mouse.target = Polymer.dom(ev).rootTarget;
ignoreMouse(true);
}
}
}
handled = ev[HANDLED_OBJ];
if (handled.skip) {
return;
}
var recognizers = Gestures.recognizers;
for (var i = 0, r; i < recognizers.length; i++) {
r = recognizers[i];
if (gs[r.name] && !handled[r.name]) {
if (r.flow && r.flow.start.indexOf(ev.type) > -1) {
if (r.reset) {
r.reset();
}
}
}
}
for (var i = 0, r; i < recognizers.length; i++) {
r = recognizers[i];
if (gs[r.name] && !handled[r.name]) {
handled[r.name] = true;
r[type](ev);
}
}
},
handleTouchAction: function (ev) {
var t = ev.changedTouches[0];
var type = ev.type;
if (type === 'touchstart') {
POINTERSTATE.touch.x = t.clientX;
POINTERSTATE.touch.y = t.clientY;
POINTERSTATE.touch.scrollDecided = false;
} else if (type === 'touchmove') {
if (POINTERSTATE.touch.scrollDecided) {
return;
}
POINTERSTATE.touch.scrollDecided = true;
var ta = firstTouchAction(ev);
var prevent = false;
var dx = Math.abs(POINTERSTATE.touch.x - t.clientX);
var dy = Math.abs(POINTERSTATE.touch.y - t.clientY);
if (!ev.cancelable) {
} else if (ta === 'none') {
prevent = true;
} else if (ta === 'pan-x') {
prevent = dy > dx;
} else if (ta === 'pan-y') {
prevent = dx > dy;
}
if (prevent) {
ev.preventDefault();
} else {
Gestures.prevent('track');
}
}
},
add: function (node, evType, handler) {
var recognizer = this.gestures[evType];
var deps = recognizer.deps;
var name = recognizer.name;
var gobj = node[GESTURE_KEY];
if (!gobj) {
node[GESTURE_KEY] = gobj = {};
}
for (var i = 0, dep, gd; i < deps.length; i++) {
dep = deps[i];
if (IS_TOUCH_ONLY && MOUSE_EVENTS.indexOf(dep) > -1) {
continue;
}
gd = gobj[dep];
if (!gd) {
gobj[dep] = gd = { _count: 0 };
}
if (gd._count === 0) {
node.addEventListener(dep, this.handleNative);
}
gd[name] = (gd[name] || 0) + 1;
gd._count = (gd._count || 0) + 1;
}
node.addEventListener(evType, handler);
if (recognizer.touchAction) {
this.setTouchAction(node, recognizer.touchAction);
}
},
remove: function (node, evType, handler) {
var recognizer = this.gestures[evType];
var deps = recognizer.deps;
var name = recognizer.name;
var gobj = node[GESTURE_KEY];
if (gobj) {
for (var i = 0, dep, gd; i < deps.length; i++) {
dep = deps[i];
gd = gobj[dep];
if (gd && gd[name]) {
gd[name] = (gd[name] || 1) - 1;
gd._count = (gd._count || 1) - 1;
if (gd._count === 0) {
node.removeEventListener(dep, this.handleNative);
}
}
}
}
node.removeEventListener(evType, handler);
},
register: function (recog) {
this.recognizers.push(recog);
for (var i = 0; i < recog.emits.length; i++) {
this.gestures[recog.emits[i]] = recog;
}
},
findRecognizerByEvent: function (evName) {
for (var i = 0, r; i < this.recognizers.length; i++) {
r = this.recognizers[i];
for (var j = 0, n; j < r.emits.length; j++) {
n = r.emits[j];
if (n === evName) {
return r;
}
}
}
return null;
},
setTouchAction: function (node, value) {
if (HAS_NATIVE_TA) {
node.style.touchAction = value;
}
node[TOUCH_ACTION] = value;
},
fire: function (target, type, detail) {
var ev = Polymer.Base.fire(type, detail, {
node: target,
bubbles: true,
cancelable: true
});
if (ev.defaultPrevented) {
var se = detail.sourceEvent;
if (se && se.preventDefault) {
se.preventDefault();
}
}
},
prevent: function (evName) {
var recognizer = this.findRecognizerByEvent(evName);
if (recognizer.info) {
recognizer.info.prevent = true;
}
}
};
Gestures.register({
name: 'downup',
deps: [
'mousedown',
'touchstart',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'mouseup',
'touchend'
]
},
emits: [
'down',
'up'
],
info: {
movefn: function () {
},
upfn: function () {
}
},
reset: function () {
untrackDocument(this.info);
},
mousedown: function (e) {
if (!hasLeftMouseButton(e)) {
return;
}
var t = Gestures.findOriginalTarget(e);
var self = this;
var movefn = function movefn(e) {
if (!hasLeftMouseButton(e)) {
self.fire('up', t, e);
untrackDocument(self.info);
}
};
var upfn = function upfn(e) {
if (hasLeftMouseButton(e)) {
self.fire('up', t, e);
}
untrackDocument(self.info);
};
trackDocument(this.info, movefn, upfn);
this.fire('down', t, e);
},
touchstart: function (e) {
this.fire('down', Gestures.findOriginalTarget(e), e.changedTouches[0]);
},
touchend: function (e) {
this.fire('up', Gestures.findOriginalTarget(e), e.changedTouches[0]);
},
fire: function (type, target, event) {
var self = this;
Gestures.fire(target, type, {
x: event.clientX,
y: event.clientY,
sourceEvent: event,
prevent: Gestures.prevent.bind(Gestures)
});
}
});
Gestures.register({
name: 'track',
touchAction: 'none',
deps: [
'mousedown',
'touchstart',
'touchmove',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'mouseup',
'touchend'
]
},
emits: ['track'],
info: {
x: 0,
y: 0,
state: 'start',
started: false,
moves: [],
addMove: function (move) {
if (this.moves.length > TRACK_LENGTH) {
this.moves.shift();
}
this.moves.push(move);
},
movefn: function () {
},
upfn: function () {
},
prevent: false
},
reset: function () {
this.info.state = 'start';
this.info.started = false;
this.info.moves = [];
this.info.x = 0;
this.info.y = 0;
this.info.prevent = false;
untrackDocument(this.info);
},
hasMovedEnough: function (x, y) {
if (this.info.prevent) {
return false;
}
if (this.info.started) {
return true;
}
var dx = Math.abs(this.info.x - x);
var dy = Math.abs(this.info.y - y);
return dx >= TRACK_DISTANCE || dy >= TRACK_DISTANCE;
},
mousedown: function (e) {
if (!hasLeftMouseButton(e)) {
return;
}
var t = Gestures.findOriginalTarget(e);
var self = this;
var movefn = function movefn(e) {
var x = e.clientX, y = e.clientY;
if (self.hasMovedEnough(x, y)) {
self.info.state = self.info.started ? e.type === 'mouseup' ? 'end' : 'track' : 'start';
self.info.addMove({
x: x,
y: y
});
if (!hasLeftMouseButton(e)) {
self.info.state = 'end';
untrackDocument(self.info);
}
self.fire(t, e);
self.info.started = true;
}
};
var upfn = function upfn(e) {
if (self.info.started) {
Gestures.prevent('tap');
movefn(e);
}
untrackDocument(self.info);
};
trackDocument(this.info, movefn, upfn);
this.info.x = e.clientX;
this.info.y = e.clientY;
},
touchstart: function (e) {
var ct = e.changedTouches[0];
this.info.x = ct.clientX;
this.info.y = ct.clientY;
},
touchmove: function (e) {
var t = Gestures.findOriginalTarget(e);
var ct = e.changedTouches[0];
var x = ct.clientX, y = ct.clientY;
if (this.hasMovedEnough(x, y)) {
this.info.addMove({
x: x,
y: y
});
this.fire(t, ct);
this.info.state = 'track';
this.info.started = true;
}
},
touchend: function (e) {
var t = Gestures.findOriginalTarget(e);
var ct = e.changedTouches[0];
if (this.info.started) {
Gestures.prevent('tap');
this.info.state = 'end';
this.info.addMove({
x: ct.clientX,
y: ct.clientY
});
this.fire(t, ct);
}
},
fire: function (target, touch) {
var secondlast = this.info.moves[this.info.moves.length - 2];
var lastmove = this.info.moves[this.info.moves.length - 1];
var dx = lastmove.x - this.info.x;
var dy = lastmove.y - this.info.y;
var ddx, ddy = 0;
if (secondlast) {
ddx = lastmove.x - secondlast.x;
ddy = lastmove.y - secondlast.y;
}
return Gestures.fire(target, 'track', {
state: this.info.state,
x: touch.clientX,
y: touch.clientY,
dx: dx,
dy: dy,
ddx: ddx,
ddy: ddy,
sourceEvent: touch,
hover: function () {
return Gestures.deepTargetFind(touch.clientX, touch.clientY);
}
});
}
});
Gestures.register({
name: 'tap',
deps: [
'mousedown',
'click',
'touchstart',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'click',
'touchend'
]
},
emits: ['tap'],
info: {
x: NaN,
y: NaN,
prevent: false
},
reset: function () {
this.info.x = NaN;
this.info.y = NaN;
this.info.prevent = false;
},
save: function (e) {
this.info.x = e.clientX;
this.info.y = e.clientY;
},
mousedown: function (e) {
if (hasLeftMouseButton(e)) {
this.save(e);
}
},
click: function (e) {
if (hasLeftMouseButton(e)) {
this.forward(e);
}
},
touchstart: function (e) {
this.save(e.changedTouches[0]);
},
touchend: function (e) {
this.forward(e.changedTouches[0]);
},
forward: function (e) {
var dx = Math.abs(e.clientX - this.info.x);
var dy = Math.abs(e.clientY - this.info.y);
var t = Gestures.findOriginalTarget(e);
if (isNaN(dx) || isNaN(dy) || dx <= TAP_DISTANCE && dy <= TAP_DISTANCE || isSyntheticClick(e)) {
if (!this.info.prevent) {
Gestures.fire(t, 'tap', {
x: e.clientX,
y: e.clientY,
sourceEvent: e
});
}
}
}
});
var DIRECTION_MAP = {
x: 'pan-x',
y: 'pan-y',
none: 'none',
all: 'auto'
};
Polymer.Base._addFeature({
_listen: function (node, eventName, handler) {
if (Gestures.gestures[eventName]) {
Gestures.add(node, eventName, handler);
} else {
node.addEventListener(eventName, handler);
}
},
_unlisten: function (node, eventName, handler) {
if (Gestures.gestures[eventName]) {
Gestures.remove(node, eventName, handler);
} else {
node.removeEventListener(eventName, handler);
}
},
setScrollDirection: function (direction, node) {
node = node || this;
Gestures.setTouchAction(node, DIRECTION_MAP[direction] || 'auto');
}
});
Polymer.Gestures = Gestures;
}());
Polymer.Async = {
_currVal: 0,
_lastVal: 0,
_callbacks: [],
_twiddleContent: 0,
_twiddle: document.createTextNode(''),
run: function (callback, waitTime) {
if (waitTime > 0) {
return ~setTimeout(callback, waitTime);
} else {
this._twiddle.textContent = this._twiddleContent++;
this._callbacks.push(callback);
return this._currVal++;
}
},
cancel: function (handle) {
if (handle < 0) {
clearTimeout(~handle);
} else {
var idx = handle - this._lastVal;
if (idx >= 0) {
if (!this._callbacks[idx]) {
throw 'invalid async handle: ' + handle;
}
this._callbacks[idx] = null;
}
}
},
_atEndOfMicrotask: function () {
var len = this._callbacks.length;
for (var i = 0; i < len; i++) {
var cb = this._callbacks[i];
if (cb) {
try {
cb();
} catch (e) {
i++;
this._callbacks.splice(0, i);
this._lastVal += i;
this._twiddle.textContent = this._twiddleContent++;
throw e;
}
}
}
this._callbacks.splice(0, len);
this._lastVal += len;
}
};
new (window.MutationObserver || JsMutationObserver)(Polymer.Async._atEndOfMicrotask.bind(Polymer.Async)).observe(Polymer.Async._twiddle, { characterData: true });
Polymer.Debounce = function () {
var Async = Polymer.Async;
var Debouncer = function (context) {
this.context = context;
this.boundComplete = this.complete.bind(this);
};
Debouncer.prototype = {
go: function (callback, wait) {
var h;
this.finish = function () {
Async.cancel(h);
};
h = Async.run(this.boundComplete, wait);
this.callback = callback;
},
stop: function () {
if (this.finish) {
this.finish();
this.finish = null;
}
},
complete: function () {
if (this.finish) {
this.stop();
this.callback.call(this.context);
}
}
};
function debounce(debouncer, callback, wait) {
if (debouncer) {
debouncer.stop();
} else {
debouncer = new Debouncer(this);
}
debouncer.go(callback, wait);
return debouncer;
}
return debounce;
}();
Polymer.Base._addFeature({
$$: function (slctr) {
return Polymer.dom(this.root).querySelector(slctr);
},
toggleClass: function (name, bool, node) {
node = node || this;
if (arguments.length == 1) {
bool = !node.classList.contains(name);
}
if (bool) {
Polymer.dom(node).classList.add(name);
} else {
Polymer.dom(node).classList.remove(name);
}
},
toggleAttribute: function (name, bool, node) {
node = node || this;
if (arguments.length == 1) {
bool = !node.hasAttribute(name);
}
if (bool) {
Polymer.dom(node).setAttribute(name, '');
} else {
Polymer.dom(node).removeAttribute(name);
}
},
classFollows: function (name, toElement, fromElement) {
if (fromElement) {
Polymer.dom(fromElement).classList.remove(name);
}
if (toElement) {
Polymer.dom(toElement).classList.add(name);
}
},
attributeFollows: function (name, toElement, fromElement) {
if (fromElement) {
Polymer.dom(fromElement).removeAttribute(name);
}
if (toElement) {
Polymer.dom(toElement).setAttribute(name, '');
}
},
getContentChildNodes: function (slctr) {
var content = Polymer.dom(this.root).querySelector(slctr || 'content');
return content ? Polymer.dom(content).getDistributedNodes() : [];
},
getContentChildren: function (slctr) {
return this.getContentChildNodes(slctr).filter(function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
},
fire: function (type, detail, options) {
options = options || Polymer.nob;
var node = options.node || this;
var detail = detail === null || detail === undefined ? Polymer.nob : detail;
var bubbles = options.bubbles === undefined ? true : options.bubbles;
var cancelable = Boolean(options.cancelable);
var event = new CustomEvent(type, {
bubbles: Boolean(bubbles),
cancelable: cancelable,
detail: detail
});
node.dispatchEvent(event);
return event;
},
async: function (callback, waitTime) {
return Polymer.Async.run(callback.bind(this), waitTime);
},
cancelAsync: function (handle) {
Polymer.Async.cancel(handle);
},
arrayDelete: function (path, item) {
var index;
if (Array.isArray(path)) {
index = path.indexOf(item);
if (index >= 0) {
return path.splice(index, 1);
}
} else {
var arr = this.get(path);
index = arr.indexOf(item);
if (index >= 0) {
return this.splice(path, index, 1);
}
}
},
transform: function (transform, node) {
node = node || this;
node.style.webkitTransform = transform;
node.style.transform = transform;
},
translate3d: function (x, y, z, node) {
node = node || this;
this.transform('translate3d(' + x + ',' + y + ',' + z + ')', node);
},
importHref: function (href, onload, onerror) {
var l = document.createElement('link');
l.rel = 'import';
l.href = href;
if (onload) {
l.onload = onload.bind(this);
}
if (onerror) {
l.onerror = onerror.bind(this);
}
document.head.appendChild(l);
return l;
},
create: function (tag, props) {
var elt = document.createElement(tag);
if (props) {
for (var n in props) {
elt[n] = props[n];
}
}
return elt;
}
});
Polymer.Bind = {
prepareModel: function (model) {
model._propertyEffects = {};
model._bindListeners = [];
Polymer.Base.mixin(model, this._modelApi);
},
_modelApi: {
_notifyChange: function (property) {
var eventName = Polymer.CaseMap.camelToDashCase(property) + '-changed';
Polymer.Base.fire(eventName, { value: this[property] }, {
bubbles: false,
node: this
});
},
_propertySetter: function (property, value, effects, fromAbove) {
var old = this.__data__[property];
if (old !== value && (old === old || value === value)) {
this.__data__[property] = value;
if (typeof value == 'object') {
this._clearPath(property);
}
if (this._propertyChanged) {
this._propertyChanged(property, value, old);
}
if (effects) {
this._effectEffects(property, value, effects, old, fromAbove);
}
}
return old;
},
__setProperty: function (property, value, quiet, node) {
node = node || this;
var effects = node._propertyEffects && node._propertyEffects[property];
if (effects) {
node._propertySetter(property, value, effects, quiet);
} else {
node[property] = value;
}
},
_effectEffects: function (property, value, effects, old, fromAbove) {
effects.forEach(function (fx) {
var fn = Polymer.Bind['_' + fx.kind + 'Effect'];
if (fn) {
fn.call(this, property, value, fx.effect, old, fromAbove);
}
}, this);
},
_clearPath: function (path) {
for (var prop in this.__data__) {
if (prop.indexOf(path + '.') === 0) {
this.__data__[prop] = undefined;
}
}
}
},
ensurePropertyEffects: function (model, property) {
var fx = model._propertyEffects[property];
if (!fx) {
fx = model._propertyEffects[property] = [];
}
return fx;
},
addPropertyEffect: function (model, property, kind, effect) {
var fx = this.ensurePropertyEffects(model, property);
fx.push({
kind: kind,
effect: effect
});
},
createBindings: function (model) {
var fx$ = model._propertyEffects;
if (fx$) {
for (var n in fx$) {
var fx = fx$[n];
fx.sort(this._sortPropertyEffects);
this._createAccessors(model, n, fx);
}
}
},
_sortPropertyEffects: function () {
var EFFECT_ORDER = {
'compute': 0,
'annotation': 1,
'computedAnnotation': 2,
'reflect': 3,
'notify': 4,
'observer': 5,
'complexObserver': 6,
'function': 7
};
return function (a, b) {
return EFFECT_ORDER[a.kind] - EFFECT_ORDER[b.kind];
};
}(),
_createAccessors: function (model, property, effects) {
var defun = {
get: function () {
return this.__data__[property];
}
};
var setter = function (value) {
this._propertySetter(property, value, effects);
};
var info = model.getPropertyInfo && model.getPropertyInfo(property);
if (info && info.readOnly) {
if (!info.computed) {
model['_set' + this.upper(property)] = setter;
}
} else {
defun.set = setter;
}
Object.defineProperty(model, property, defun);
},
upper: function (name) {
return name[0].toUpperCase() + name.substring(1);
},
_addAnnotatedListener: function (model, index, property, path, event) {
var fn = this._notedListenerFactory(property, path, this._isStructured(path), this._isEventBogus);
var eventName = event || Polymer.CaseMap.camelToDashCase(property) + '-changed';
model._bindListeners.push({
index: index,
property: property,
path: path,
changedFn: fn,
event: eventName
});
},
_isStructured: function (path) {
return path.indexOf('.') > 0;
},
_isEventBogus: function (e, target) {
return e.path && e.path[0] !== target;
},
_notedListenerFactory: function (property, path, isStructured, bogusTest) {
return function (e, target) {
if (!bogusTest(e, target)) {
if (e.detail && e.detail.path) {
this.notifyPath(this._fixPath(path, property, e.detail.path), e.detail.value);
} else {
var value = target[property];
if (!isStructured) {
this[path] = target[property];
} else {
if (this.__data__[path] != value) {
this.set(path, value);
}
}
}
}
};
},
prepareInstance: function (inst) {
inst.__data__ = Object.create(null);
},
setupBindListeners: function (inst) {
inst._bindListeners.forEach(function (info) {
var node = inst._nodes[info.index];
node.addEventListener(info.event, inst._notifyListener.bind(inst, info.changedFn));
});
}
};
Polymer.Base.extend(Polymer.Bind, {
_shouldAddListener: function (effect) {
return effect.name && effect.mode === '{' && !effect.negate && effect.kind != 'attribute';
},
_annotationEffect: function (source, value, effect) {
if (source != effect.value) {
value = this.get(effect.value);
this.__data__[effect.value] = value;
}
var calc = effect.negate ? !value : value;
if (!effect.customEvent || this._nodes[effect.index][effect.name] !== calc) {
return this._applyEffectValue(calc, effect);
}
},
_reflectEffect: function (source) {
this.reflectPropertyToAttribute(source);
},
_notifyEffect: function (source, value, effect, old, fromAbove) {
if (!fromAbove) {
this._notifyChange(source);
}
},
_functionEffect: function (source, value, fn, old, fromAbove) {
fn.call(this, source, value, old, fromAbove);
},
_observerEffect: function (source, value, effect, old) {
var fn = this[effect.method];
if (fn) {
fn.call(this, value, old);
} else {
this._warn(this._logf('_observerEffect', 'observer method `' + effect.method + '` not defined'));
}
},
_complexObserverEffect: function (source, value, effect) {
var fn = this[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
fn.apply(this, args);
}
} else {
this._warn(this._logf('_complexObserverEffect', 'observer method `' + effect.method + '` not defined'));
}
},
_computeEffect: function (source, value, effect) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
var fn = this[effect.method];
if (fn) {
this.__setProperty(effect.property, fn.apply(this, args));
} else {
this._warn(this._logf('_computeEffect', 'compute method `' + effect.method + '` not defined'));
}
}
},
_annotatedComputationEffect: function (source, value, effect) {
var computedHost = this._rootDataHost || this;
var fn = computedHost[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
var computedvalue = fn.apply(computedHost, args);
if (effect.negate) {
computedvalue = !computedvalue;
}
this._applyEffectValue(computedvalue, effect);
}
} else {
computedHost._warn(computedHost._logf('_annotatedComputationEffect', 'compute method `' + effect.method + '` not defined'));
}
},
_marshalArgs: function (model, effect, path, value) {
var values = [];
var args = effect.args;
for (var i = 0, l = args.length; i < l; i++) {
var arg = args[i];
var name = arg.name;
var v;
if (arg.literal) {
v = arg.value;
} else if (arg.structured) {
v = Polymer.Base.get(name, model);
} else {
v = model[name];
}
if (args.length > 1 && v === undefined) {
return;
}
if (arg.wildcard) {
var baseChanged = name.indexOf(path + '.') === 0;
var matches = effect.trigger.name.indexOf(name) === 0 && !baseChanged;
values[i] = {
path: matches ? path : name,
value: matches ? value : v,
base: v
};
} else {
values[i] = v;
}
}
return values;
}
});
Polymer.Base._addFeature({
_addPropertyEffect: function (property, kind, effect) {
Polymer.Bind.addPropertyEffect(this, property, kind, effect);
},
_prepEffects: function () {
Polymer.Bind.prepareModel(this);
this._addAnnotationEffects(this._notes);
},
_prepBindings: function () {
Polymer.Bind.createBindings(this);
},
_addPropertyEffects: function (properties) {
if (properties) {
for (var p in properties) {
var prop = properties[p];
if (prop.observer) {
this._addObserverEffect(p, prop.observer);
}
if (prop.computed) {
prop.readOnly = true;
this._addComputedEffect(p, prop.computed);
}
if (prop.notify) {
this._addPropertyEffect(p, 'notify');
}
if (prop.reflectToAttribute) {
this._addPropertyEffect(p, 'reflect');
}
if (prop.readOnly) {
Polymer.Bind.ensurePropertyEffects(this, p);
}
}
}
},
_addComputedEffect: function (name, expression) {
var sig = this._parseMethod(expression);
sig.args.forEach(function (arg) {
this._addPropertyEffect(arg.model, 'compute', {
method: sig.method,
args: sig.args,
trigger: arg,
property: name
});
}, this);
},
_addObserverEffect: function (property, observer) {
this._addPropertyEffect(property, 'observer', {
method: observer,
property: property
});
},
_addComplexObserverEffects: function (observers) {
if (observers) {
observers.forEach(function (observer) {
this._addComplexObserverEffect(observer);
}, this);
}
},
_addComplexObserverEffect: function (observer) {
var sig = this._parseMethod(observer);
sig.args.forEach(function (arg) {
this._addPropertyEffect(arg.model, 'complexObserver', {
method: sig.method,
args: sig.args,
trigger: arg
});
}, this);
},
_addAnnotationEffects: function (notes) {
this._nodes = [];
notes.forEach(function (note) {
var index = this._nodes.push(note) - 1;
note.bindings.forEach(function (binding) {
this._addAnnotationEffect(binding, index);
}, this);
}, this);
},
_addAnnotationEffect: function (note, index) {
if (Polymer.Bind._shouldAddListener(note)) {
Polymer.Bind._addAnnotatedListener(this, index, note.name, note.value, note.event);
}
if (note.signature) {
this._addAnnotatedComputationEffect(note, index);
} else {
note.index = index;
this._addPropertyEffect(note.model, 'annotation', note);
}
},
_addAnnotatedComputationEffect: function (note, index) {
var sig = note.signature;
if (sig.static) {
this.__addAnnotatedComputationEffect('__static__', index, note, sig, null);
} else {
sig.args.forEach(function (arg) {
if (!arg.literal) {
this.__addAnnotatedComputationEffect(arg.model, index, note, sig, arg);
}
}, this);
}
},
__addAnnotatedComputationEffect: function (property, index, note, sig, trigger) {
this._addPropertyEffect(property, 'annotatedComputation', {
index: index,
kind: note.kind,
property: note.name,
negate: note.negate,
method: sig.method,
args: sig.args,
trigger: trigger
});
},
_parseMethod: function (expression) {
var m = expression.match(/([^\s]+)\((.*)\)/);
if (m) {
var sig = {
method: m[1],
static: true
};
if (m[2].trim()) {
var args = m[2].replace(/\\,/g, '&comma;').split(',');
return this._parseArgs(args, sig);
} else {
sig.args = Polymer.nar;
return sig;
}
}
},
_parseArgs: function (argList, sig) {
sig.args = argList.map(function (rawArg) {
var arg = this._parseArg(rawArg);
if (!arg.literal) {
sig.static = false;
}
return arg;
}, this);
return sig;
},
_parseArg: function (rawArg) {
var arg = rawArg.trim().replace(/&comma;/g, ',').replace(/\\(.)/g, '$1');
var a = {
name: arg,
model: this._modelForPath(arg)
};
var fc = arg[0];
if (fc === '-') {
fc = arg[1];
}
if (fc >= '0' && fc <= '9') {
fc = '#';
}
switch (fc) {
case '\'':
case '"':
a.value = arg.slice(1, -1);
a.literal = true;
break;
case '#':
a.value = Number(arg);
a.literal = true;
break;
}
if (!a.literal) {
a.structured = arg.indexOf('.') > 0;
if (a.structured) {
a.wildcard = arg.slice(-2) == '.*';
if (a.wildcard) {
a.name = arg.slice(0, -2);
}
}
}
return a;
},
_marshalInstanceEffects: function () {
Polymer.Bind.prepareInstance(this);
Polymer.Bind.setupBindListeners(this);
},
_applyEffectValue: function (value, info) {
var node = this._nodes[info.index];
var property = info.property || info.name || 'textContent';
if (info.kind == 'attribute') {
this.serializeValueToAttribute(value, property, node);
} else {
if (property === 'className') {
value = this._scopeElementClass(node, value);
}
if (property === 'textContent' || node.localName == 'input' && property == 'value') {
value = value == undefined ? '' : value;
}
return node[property] = value;
}
},
_executeStaticEffects: function () {
if (this._propertyEffects.__static__) {
this._effectEffects('__static__', null, this._propertyEffects.__static__);
}
}
});
Polymer.Base._addFeature({
_setupConfigure: function (initialConfig) {
this._config = {};
for (var i in initialConfig) {
if (initialConfig[i] !== undefined) {
this._config[i] = initialConfig[i];
}
}
this._handlers = [];
},
_marshalAttributes: function () {
this._takeAttributesToModel(this._config);
},
_attributeChangedImpl: function (name) {
var model = this._clientsReadied ? this : this._config;
this._setAttributeToProperty(model, name);
},
_configValue: function (name, value) {
this._config[name] = value;
},
_beforeClientsReady: function () {
this._configure();
},
_configure: function () {
this._configureAnnotationReferences();
this._aboveConfig = this.mixin({}, this._config);
var config = {};
this.behaviors.forEach(function (b) {
this._configureProperties(b.properties, config);
}, this);
this._configureProperties(this.properties, config);
this._mixinConfigure(config, this._aboveConfig);
this._config = config;
this._distributeConfig(this._config);
},
_configureProperties: function (properties, config) {
for (var i in properties) {
var c = properties[i];
if (c.value !== undefined) {
var value = c.value;
if (typeof value == 'function') {
value = value.call(this, this._config);
}
config[i] = value;
}
}
},
_mixinConfigure: function (a, b) {
for (var prop in b) {
if (!this.getPropertyInfo(prop).readOnly) {
a[prop] = b[prop];
}
}
},
_distributeConfig: function (config) {
var fx$ = this._propertyEffects;
if (fx$) {
for (var p in config) {
var fx = fx$[p];
if (fx) {
for (var i = 0, l = fx.length, x; i < l && (x = fx[i]); i++) {
if (x.kind === 'annotation') {
var node = this._nodes[x.effect.index];
if (node._configValue) {
var value = p === x.effect.value ? config[p] : this.get(x.effect.value, config);
node._configValue(x.effect.name, value);
}
}
}
}
}
}
},
_afterClientsReady: function () {
this._executeStaticEffects();
this._applyConfig(this._config, this._aboveConfig);
this._flushHandlers();
},
_applyConfig: function (config, aboveConfig) {
for (var n in config) {
if (this[n] === undefined) {
this.__setProperty(n, config[n], n in aboveConfig);
}
}
},
_notifyListener: function (fn, e) {
if (!this._clientsReadied) {
this._queueHandler([
fn,
e,
e.target
]);
} else {
return fn.call(this, e, e.target);
}
},
_queueHandler: function (args) {
this._handlers.push(args);
},
_flushHandlers: function () {
var h$ = this._handlers;
for (var i = 0, l = h$.length, h; i < l && (h = h$[i]); i++) {
h[0].call(this, h[1], h[2]);
}
}
});
(function () {
'use strict';
Polymer.Base._addFeature({
notifyPath: function (path, value, fromAbove) {
var old = this._propertySetter(path, value);
if (old !== value && (old === old || value === value)) {
this._pathEffector(path, value);
if (!fromAbove) {
this._notifyPath(path, value);
}
return true;
}
},
_getPathParts: function (path) {
if (Array.isArray(path)) {
var parts = [];
for (var i = 0; i < path.length; i++) {
var args = path[i].toString().split('.');
for (var j = 0; j < args.length; j++) {
parts.push(args[j]);
}
}
return parts;
} else {
return path.toString().split('.');
}
},
set: function (path, value, root) {
var prop = root || this;
var parts = this._getPathParts(path);
var array;
var last = parts[parts.length - 1];
if (parts.length > 1) {
for (var i = 0; i < parts.length - 1; i++) {
var part = parts[i];
prop = prop[part];
if (array && parseInt(part) == part) {
parts[i] = Polymer.Collection.get(array).getKey(prop);
}
if (!prop) {
return;
}
array = Array.isArray(prop) ? prop : null;
}
if (array && parseInt(last) == last) {
var coll = Polymer.Collection.get(array);
var old = prop[last];
var key = coll.getKey(old);
parts[i] = key;
coll.setItem(key, value);
}
prop[last] = value;
if (!root) {
this.notifyPath(parts.join('.'), value);
}
} else {
prop[path] = value;
}
},
get: function (path, root) {
var prop = root || this;
var parts = this._getPathParts(path);
var last = parts.pop();
while (parts.length) {
prop = prop[parts.shift()];
if (!prop) {
return;
}
}
return prop[last];
},
_pathEffector: function (path, value) {
var model = this._modelForPath(path);
var fx$ = this._propertyEffects[model];
if (fx$) {
fx$.forEach(function (fx) {
var fxFn = this['_' + fx.kind + 'PathEffect'];
if (fxFn) {
fxFn.call(this, path, value, fx.effect);
}
}, this);
}
if (this._boundPaths) {
this._notifyBoundPaths(path, value);
}
},
_annotationPathEffect: function (path, value, effect) {
if (effect.value === path || effect.value.indexOf(path + '.') === 0) {
Polymer.Bind._annotationEffect.call(this, path, value, effect);
} else if (path.indexOf(effect.value + '.') === 0 && !effect.negate) {
var node = this._nodes[effect.index];
if (node && node.notifyPath) {
var p = this._fixPath(effect.name, effect.value, path);
node.notifyPath(p, value, true);
}
}
},
_complexObserverPathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._complexObserverEffect.call(this, path, value, effect);
}
},
_computePathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._computeEffect.call(this, path, value, effect);
}
},
_annotatedComputationPathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._annotatedComputationEffect.call(this, path, value, effect);
}
},
_pathMatchesEffect: function (path, effect) {
var effectArg = effect.trigger.name;
return effectArg == path || effectArg.indexOf(path + '.') === 0 || effect.trigger.wildcard && path.indexOf(effectArg) === 0;
},
linkPaths: function (to, from) {
this._boundPaths = this._boundPaths || {};
if (from) {
this._boundPaths[to] = from;
} else {
this.unbindPath(to);
}
},
unlinkPaths: function (path) {
if (this._boundPaths) {
delete this._boundPaths[path];
}
},
_notifyBoundPaths: function (path, value) {
var from, to;
for (var a in this._boundPaths) {
var b = this._boundPaths[a];
if (path.indexOf(a + '.') == 0) {
from = a;
to = b;
break;
}
if (path.indexOf(b + '.') == 0) {
from = b;
to = a;
break;
}
}
if (from && to) {
var p = this._fixPath(to, from, path);
this.notifyPath(p, value);
}
},
_fixPath: function (property, root, path) {
return property + path.slice(root.length);
},
_notifyPath: function (path, value) {
var rootName = this._modelForPath(path);
var dashCaseName = Polymer.CaseMap.camelToDashCase(rootName);
var eventName = dashCaseName + this._EVENT_CHANGED;
this.fire(eventName, {
path: path,
value: value
}, { bubbles: false });
},
_modelForPath: function (path) {
var dot = path.indexOf('.');
return dot < 0 ? path : path.slice(0, dot);
},
_EVENT_CHANGED: '-changed',
_notifySplice: function (array, path, index, added, removed) {
var splices = [{
index: index,
addedCount: added,
removed: removed,
object: array,
type: 'splice'
}];
var change = {
keySplices: Polymer.Collection.applySplices(array, splices),
indexSplices: splices
};
this.set(path + '.splices', change);
if (added != removed.length) {
this.notifyPath(path + '.length', array.length);
}
change.keySplices = null;
change.indexSplices = null;
},
push: function (path) {
var array = this.get(path);
var args = Array.prototype.slice.call(arguments, 1);
var len = array.length;
var ret = array.push.apply(array, args);
if (args.length) {
this._notifySplice(array, path, len, args.length, []);
}
return ret;
},
pop: function (path) {
var array = this.get(path);
var hadLength = Boolean(array.length);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.pop.apply(array, args);
if (hadLength) {
this._notifySplice(array, path, array.length, 0, [ret]);
}
return ret;
},
splice: function (path, start, deleteCount) {
var array = this.get(path);
if (start < 0) {
start = array.length - Math.floor(-start);
} else {
start = Math.floor(start);
}
if (!start) {
start = 0;
}
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.splice.apply(array, args);
var addedCount = Math.max(args.length - 2, 0);
if (addedCount || ret.length) {
this._notifySplice(array, path, start, addedCount, ret);
}
return ret;
},
shift: function (path) {
var array = this.get(path);
var hadLength = Boolean(array.length);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.shift.apply(array, args);
if (hadLength) {
this._notifySplice(array, path, 0, 0, [ret]);
}
return ret;
},
unshift: function (path) {
var array = this.get(path);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.unshift.apply(array, args);
if (args.length) {
this._notifySplice(array, path, 0, args.length, []);
}
return ret;
}
});
}());
Polymer.Base._addFeature({
resolveUrl: function (url) {
var module = Polymer.DomModule.import(this.is);
var root = '';
if (module) {
var assetPath = module.getAttribute('assetpath') || '';
root = Polymer.ResolveUrl.resolveUrl(assetPath, module.ownerDocument.baseURI);
}
return Polymer.ResolveUrl.resolveUrl(url, root);
}
});
Polymer.CssParse = function () {
var api = {
parse: function (text) {
text = this._clean(text);
return this._parseCss(this._lex(text), text);
},
_clean: function (cssText) {
return cssText.replace(this._rx.comments, '').replace(this._rx.port, '');
},
_lex: function (text) {
var root = {
start: 0,
end: text.length
};
var n = root;
for (var i = 0, s = 0, l = text.length; i < l; i++) {
switch (text[i]) {
case this.OPEN_BRACE:
if (!n.rules) {
n.rules = [];
}
var p = n;
var previous = p.rules[p.rules.length - 1];
n = {
start: i + 1,
parent: p,
previous: previous
};
p.rules.push(n);
break;
case this.CLOSE_BRACE:
n.end = i + 1;
n = n.parent || root;
break;
}
}
return root;
},
_parseCss: function (node, text) {
var t = text.substring(node.start, node.end - 1);
node.parsedCssText = node.cssText = t.trim();
if (node.parent) {
var ss = node.previous ? node.previous.end : node.parent.start;
t = text.substring(ss, node.start - 1);
t = t.substring(t.lastIndexOf(';') + 1);
var s = node.parsedSelector = node.selector = t.trim();
node.atRule = s.indexOf(this.AT_START) === 0;
if (node.atRule) {
if (s.indexOf(this.MEDIA_START) === 0) {
node.type = this.types.MEDIA_RULE;
} else if (s.match(this._rx.keyframesRule)) {
node.type = this.types.KEYFRAMES_RULE;
}
} else {
if (s.indexOf(this.VAR_START) === 0) {
node.type = this.types.MIXIN_RULE;
} else {
node.type = this.types.STYLE_RULE;
}
}
}
var r$ = node.rules;
if (r$) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
this._parseCss(r, text);
}
}
return node;
},
stringify: function (node, preserveProperties, text) {
text = text || '';
var cssText = '';
if (node.cssText || node.rules) {
var r$ = node.rules;
if (r$ && (preserveProperties || !this._hasMixinRules(r$))) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
cssText = this.stringify(r, preserveProperties, cssText);
}
} else {
cssText = preserveProperties ? node.cssText : this.removeCustomProps(node.cssText);
cssText = cssText.trim();
if (cssText) {
cssText = '  ' + cssText + '\n';
}
}
}
if (cssText) {
if (node.selector) {
text += node.selector + ' ' + this.OPEN_BRACE + '\n';
}
text += cssText;
if (node.selector) {
text += this.CLOSE_BRACE + '\n\n';
}
}
return text;
},
_hasMixinRules: function (rules) {
return rules[0].selector.indexOf(this.VAR_START) >= 0;
},
removeCustomProps: function (cssText) {
cssText = this.removeCustomPropAssignment(cssText);
return this.removeCustomPropApply(cssText);
},
removeCustomPropAssignment: function (cssText) {
return cssText.replace(this._rx.customProp, '').replace(this._rx.mixinProp, '');
},
removeCustomPropApply: function (cssText) {
return cssText.replace(this._rx.mixinApply, '').replace(this._rx.varApply, '');
},
types: {
STYLE_RULE: 1,
KEYFRAMES_RULE: 7,
MEDIA_RULE: 4,
MIXIN_RULE: 1000
},
OPEN_BRACE: '{',
CLOSE_BRACE: '}',
_rx: {
comments: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,
port: /@import[^;]*;/gim,
customProp: /(?:^|[\s;])--[^;{]*?:[^{};]*?(?:[;\n]|$)/gim,
mixinProp: /(?:^|[\s;])--[^;{]*?:[^{;]*?{[^}]*?}(?:[;\n]|$)?/gim,
mixinApply: /@apply[\s]*\([^)]*?\)[\s]*(?:[;\n]|$)?/gim,
varApply: /[^;:]*?:[^;]*var[^;]*(?:[;\n]|$)?/gim,
keyframesRule: /^@[^\s]*keyframes/
},
VAR_START: '--',
MEDIA_START: '@media',
AT_START: '@'
};
return api;
}();
Polymer.StyleUtil = function () {
return {
MODULE_STYLES_SELECTOR: 'style, link[rel=import][type~=css], template',
INCLUDE_ATTR: 'include',
toCssText: function (rules, callback, preserveProperties) {
if (typeof rules === 'string') {
rules = this.parser.parse(rules);
}
if (callback) {
this.forEachStyleRule(rules, callback);
}
return this.parser.stringify(rules, preserveProperties);
},
forRulesInStyles: function (styles, callback) {
if (styles) {
for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
this.forEachStyleRule(this.rulesForStyle(s), callback);
}
}
},
rulesForStyle: function (style) {
if (!style.__cssRules && style.textContent) {
style.__cssRules = this.parser.parse(style.textContent);
}
return style.__cssRules;
},
clearStyleRules: function (style) {
style.__cssRules = null;
},
forEachStyleRule: function (node, callback) {
if (!node) {
return;
}
var s = node.parsedSelector;
var skipRules = false;
if (node.type === this.ruleTypes.STYLE_RULE) {
callback(node);
} else if (node.type === this.ruleTypes.KEYFRAMES_RULE || node.type === this.ruleTypes.MIXIN_RULE) {
skipRules = true;
}
var r$ = node.rules;
if (r$ && !skipRules) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
this.forEachStyleRule(r, callback);
}
}
},
applyCss: function (cssText, moniker, target, afterNode) {
var style = document.createElement('style');
if (moniker) {
style.setAttribute('scope', moniker);
}
style.textContent = cssText;
target = target || document.head;
if (!afterNode) {
var n$ = target.querySelectorAll('style[scope]');
afterNode = n$[n$.length - 1];
}
target.insertBefore(style, afterNode && afterNode.nextSibling || target.firstChild);
return style;
},
cssFromModules: function (moduleIds, warnIfNotFound) {
var modules = moduleIds.trim().split(' ');
var cssText = '';
for (var i = 0; i < modules.length; i++) {
cssText += this.cssFromModule(modules[i], warnIfNotFound);
}
return cssText;
},
cssFromModule: function (moduleId, warnIfNotFound) {
var m = Polymer.DomModule.import(moduleId);
if (m && !m._cssText) {
m._cssText = this._cssFromElement(m);
}
if (!m && warnIfNotFound) {
console.warn('Could not find style data in module named', moduleId);
}
return m && m._cssText || '';
},
_cssFromElement: function (element) {
var cssText = '';
var content = element.content || element;
var e$ = Array.prototype.slice.call(content.querySelectorAll(this.MODULE_STYLES_SELECTOR));
for (var i = 0, e; i < e$.length; i++) {
e = e$[i];
if (e.localName === 'template') {
cssText += this._cssFromElement(e);
} else {
if (e.localName === 'style') {
var include = e.getAttribute(this.INCLUDE_ATTR);
if (include) {
cssText += this.cssFromModules(include, true);
}
e = e.__appliedElement || e;
e.parentNode.removeChild(e);
cssText += this.resolveCss(e.textContent, element.ownerDocument);
} else if (e.import && e.import.body) {
cssText += this.resolveCss(e.import.body.textContent, e.import);
}
}
}
return cssText;
},
resolveCss: Polymer.ResolveUrl.resolveCss,
parser: Polymer.CssParse,
ruleTypes: Polymer.CssParse.types
};
}();
Polymer.StyleTransformer = function () {
var nativeShadow = Polymer.Settings.useNativeShadow;
var styleUtil = Polymer.StyleUtil;
var api = {
dom: function (node, scope, useAttr, shouldRemoveScope) {
this._transformDom(node, scope || '', useAttr, shouldRemoveScope);
},
_transformDom: function (node, selector, useAttr, shouldRemoveScope) {
if (node.setAttribute) {
this.element(node, selector, useAttr, shouldRemoveScope);
}
var c$ = Polymer.dom(node).childNodes;
for (var i = 0; i < c$.length; i++) {
this._transformDom(c$[i], selector, useAttr, shouldRemoveScope);
}
},
element: function (element, scope, useAttr, shouldRemoveScope) {
if (useAttr) {
if (shouldRemoveScope) {
element.removeAttribute(SCOPE_NAME);
} else {
element.setAttribute(SCOPE_NAME, scope);
}
} else {
if (scope) {
if (element.classList) {
if (shouldRemoveScope) {
element.classList.remove(SCOPE_NAME);
element.classList.remove(scope);
} else {
element.classList.add(SCOPE_NAME);
element.classList.add(scope);
}
} else if (element.getAttribute) {
var c = element.getAttribute(CLASS);
if (shouldRemoveScope) {
if (c) {
element.setAttribute(CLASS, c.replace(SCOPE_NAME, '').replace(scope, ''));
}
} else {
element.setAttribute(CLASS, c + (c ? ' ' : '') + SCOPE_NAME + ' ' + scope);
}
}
}
}
},
elementStyles: function (element, callback) {
var styles = element._styles;
var cssText = '';
for (var i = 0, l = styles.length, s, text; i < l && (s = styles[i]); i++) {
var rules = styleUtil.rulesForStyle(s);
cssText += nativeShadow ? styleUtil.toCssText(rules, callback) : this.css(rules, element.is, element.extends, callback, element._scopeCssViaAttr) + '\n\n';
}
return cssText.trim();
},
css: function (rules, scope, ext, callback, useAttr) {
var hostScope = this._calcHostScope(scope, ext);
scope = this._calcElementScope(scope, useAttr);
var self = this;
return styleUtil.toCssText(rules, function (rule) {
if (!rule.isScoped) {
self.rule(rule, scope, hostScope);
rule.isScoped = true;
}
if (callback) {
callback(rule, scope, hostScope);
}
});
},
_calcElementScope: function (scope, useAttr) {
if (scope) {
return useAttr ? CSS_ATTR_PREFIX + scope + CSS_ATTR_SUFFIX : CSS_CLASS_PREFIX + scope;
} else {
return '';
}
},
_calcHostScope: function (scope, ext) {
return ext ? '[is=' + scope + ']' : scope;
},
rule: function (rule, scope, hostScope) {
this._transformRule(rule, this._transformComplexSelector, scope, hostScope);
},
_transformRule: function (rule, transformer, scope, hostScope) {
var p$ = rule.selector.split(COMPLEX_SELECTOR_SEP);
for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
p$[i] = transformer.call(this, p, scope, hostScope);
}
rule.selector = rule.transformedSelector = p$.join(COMPLEX_SELECTOR_SEP);
},
_transformComplexSelector: function (selector, scope, hostScope) {
var stop = false;
var hostContext = false;
var self = this;
selector = selector.replace(SIMPLE_SELECTOR_SEP, function (m, c, s) {
if (!stop) {
var info = self._transformCompoundSelector(s, c, scope, hostScope);
stop = stop || info.stop;
hostContext = hostContext || info.hostContext;
c = info.combinator;
s = info.value;
} else {
s = s.replace(SCOPE_JUMP, ' ');
}
return c + s;
});
if (hostContext) {
selector = selector.replace(HOST_CONTEXT_PAREN, function (m, pre, paren, post) {
return pre + paren + ' ' + hostScope + post + COMPLEX_SELECTOR_SEP + ' ' + pre + hostScope + paren + post;
});
}
return selector;
},
_transformCompoundSelector: function (selector, combinator, scope, hostScope) {
var jumpIndex = selector.search(SCOPE_JUMP);
var hostContext = false;
if (selector.indexOf(HOST_CONTEXT) >= 0) {
hostContext = true;
} else if (selector.indexOf(HOST) >= 0) {
selector = selector.replace(HOST_PAREN, function (m, host, paren) {
return hostScope + paren;
});
selector = selector.replace(HOST, hostScope);
} else if (jumpIndex !== 0) {
selector = scope ? this._transformSimpleSelector(selector, scope) : selector;
}
if (selector.indexOf(CONTENT) >= 0) {
combinator = '';
}
var stop;
if (jumpIndex >= 0) {
selector = selector.replace(SCOPE_JUMP, ' ');
stop = true;
}
return {
value: selector,
combinator: combinator,
stop: stop,
hostContext: hostContext
};
},
_transformSimpleSelector: function (selector, scope) {
var p$ = selector.split(PSEUDO_PREFIX);
p$[0] += scope;
return p$.join(PSEUDO_PREFIX);
},
documentRule: function (rule) {
rule.selector = rule.parsedSelector;
this.normalizeRootSelector(rule);
if (!nativeShadow) {
this._transformRule(rule, this._transformDocumentSelector);
}
},
normalizeRootSelector: function (rule) {
if (rule.selector === ROOT) {
rule.selector = 'body';
}
},
_transformDocumentSelector: function (selector) {
return selector.match(SCOPE_JUMP) ? this._transformComplexSelector(selector, SCOPE_DOC_SELECTOR) : this._transformSimpleSelector(selector.trim(), SCOPE_DOC_SELECTOR);
},
SCOPE_NAME: 'style-scope'
};
var SCOPE_NAME = api.SCOPE_NAME;
var SCOPE_DOC_SELECTOR = ':not([' + SCOPE_NAME + '])' + ':not(.' + SCOPE_NAME + ')';
var COMPLEX_SELECTOR_SEP = ',';
var SIMPLE_SELECTOR_SEP = /(^|[\s>+~]+)([^\s>+~]+)/g;
var HOST = ':host';
var ROOT = ':root';
var HOST_PAREN = /(\:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/g;
var HOST_CONTEXT = ':host-context';
var HOST_CONTEXT_PAREN = /(.*)(?:\:host-context)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))(.*)/;
var CONTENT = '::content';
var SCOPE_JUMP = /\:\:content|\:\:shadow|\/deep\//;
var CSS_CLASS_PREFIX = '.';
var CSS_ATTR_PREFIX = '[' + SCOPE_NAME + '~=';
var CSS_ATTR_SUFFIX = ']';
var PSEUDO_PREFIX = ':';
var CLASS = 'class';
return api;
}();
Polymer.StyleExtends = function () {
var styleUtil = Polymer.StyleUtil;
return {
hasExtends: function (cssText) {
return Boolean(cssText.match(this.rx.EXTEND));
},
transform: function (style) {
var rules = styleUtil.rulesForStyle(style);
var self = this;
styleUtil.forEachStyleRule(rules, function (rule) {
var map = self._mapRule(rule);
if (rule.parent) {
var m;
while (m = self.rx.EXTEND.exec(rule.cssText)) {
var extend = m[1];
var extendor = self._findExtendor(extend, rule);
if (extendor) {
self._extendRule(rule, extendor);
}
}
}
rule.cssText = rule.cssText.replace(self.rx.EXTEND, '');
});
return styleUtil.toCssText(rules, function (rule) {
if (rule.selector.match(self.rx.STRIP)) {
rule.cssText = '';
}
}, true);
},
_mapRule: function (rule) {
if (rule.parent) {
var map = rule.parent.map || (rule.parent.map = {});
var parts = rule.selector.split(',');
for (var i = 0, p; i < parts.length; i++) {
p = parts[i];
map[p.trim()] = rule;
}
return map;
}
},
_findExtendor: function (extend, rule) {
return rule.parent && rule.parent.map && rule.parent.map[extend] || this._findExtendor(extend, rule.parent);
},
_extendRule: function (target, source) {
if (target.parent !== source.parent) {
this._cloneAndAddRuleToParent(source, target.parent);
}
target.extends = target.extends || (target.extends = []);
target.extends.push(source);
source.selector = source.selector.replace(this.rx.STRIP, '');
source.selector = (source.selector && source.selector + ',\n') + target.selector;
if (source.extends) {
source.extends.forEach(function (e) {
this._extendRule(target, e);
}, this);
}
},
_cloneAndAddRuleToParent: function (rule, parent) {
rule = Object.create(rule);
rule.parent = parent;
if (rule.extends) {
rule.extends = rule.extends.slice();
}
parent.rules.push(rule);
},
rx: {
EXTEND: /@extends\(([^)]*)\)\s*?;/gim,
STRIP: /%[^,]*$/
}
};
}();
(function () {
var prepElement = Polymer.Base._prepElement;
var nativeShadow = Polymer.Settings.useNativeShadow;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
var styleExtends = Polymer.StyleExtends;
Polymer.Base._addFeature({
_prepElement: function (element) {
if (this._encapsulateStyle) {
styleTransformer.element(element, this.is, this._scopeCssViaAttr);
}
prepElement.call(this, element);
},
_prepStyles: function () {
if (this._encapsulateStyle === undefined) {
this._encapsulateStyle = !nativeShadow && Boolean(this._template);
}
this._styles = this._collectStyles();
var cssText = styleTransformer.elementStyles(this);
if (cssText && this._template) {
var style = styleUtil.applyCss(cssText, this.is, nativeShadow ? this._template.content : null);
if (!nativeShadow) {
this._scopeStyle = style;
}
}
},
_collectStyles: function () {
var styles = [];
var cssText = '', m$ = this.styleModules;
if (m$) {
for (var i = 0, l = m$.length, m; i < l && (m = m$[i]); i++) {
cssText += styleUtil.cssFromModule(m);
}
}
cssText += styleUtil.cssFromModule(this.is);
if (cssText) {
var style = document.createElement('style');
style.textContent = cssText;
if (styleExtends.hasExtends(style.textContent)) {
cssText = styleExtends.transform(style);
}
styles.push(style);
}
return styles;
},
_elementAdd: function (node) {
if (this._encapsulateStyle) {
if (node.__styleScoped) {
node.__styleScoped = false;
} else {
styleTransformer.dom(node, this.is, this._scopeCssViaAttr);
}
}
},
_elementRemove: function (node) {
if (this._encapsulateStyle) {
styleTransformer.dom(node, this.is, this._scopeCssViaAttr, true);
}
},
scopeSubtree: function (container, shouldObserve) {
if (nativeShadow) {
return;
}
var self = this;
var scopify = function (node) {
if (node.nodeType === Node.ELEMENT_NODE) {
node.className = self._scopeElementClass(node, node.className);
var n$ = node.querySelectorAll('*');
Array.prototype.forEach.call(n$, function (n) {
n.className = self._scopeElementClass(n, n.className);
});
}
};
scopify(container);
if (shouldObserve) {
var mo = new MutationObserver(function (mxns) {
mxns.forEach(function (m) {
if (m.addedNodes) {
for (var i = 0; i < m.addedNodes.length; i++) {
scopify(m.addedNodes[i]);
}
}
});
});
mo.observe(container, {
childList: true,
subtree: true
});
return mo;
}
}
});
}());
Polymer.StyleProperties = function () {
'use strict';
var nativeShadow = Polymer.Settings.useNativeShadow;
var matchesSelector = Polymer.DomApi.matchesSelector;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
return {
decorateStyles: function (styles) {
var self = this, props = {};
styleUtil.forRulesInStyles(styles, function (rule) {
self.decorateRule(rule);
self.collectPropertiesInCssText(rule.propertyInfo.cssText, props);
});
var names = [];
for (var i in props) {
names.push(i);
}
return names;
},
decorateRule: function (rule) {
if (rule.propertyInfo) {
return rule.propertyInfo;
}
var info = {}, properties = {};
var hasProperties = this.collectProperties(rule, properties);
if (hasProperties) {
info.properties = properties;
rule.rules = null;
}
info.cssText = this.collectCssText(rule);
rule.propertyInfo = info;
return info;
},
collectProperties: function (rule, properties) {
var info = rule.propertyInfo;
if (info) {
if (info.properties) {
Polymer.Base.mixin(properties, info.properties);
return true;
}
} else {
var m, rx = this.rx.VAR_ASSIGN;
var cssText = rule.parsedCssText;
var any;
while (m = rx.exec(cssText)) {
properties[m[1]] = (m[2] || m[3]).trim();
any = true;
}
return any;
}
},
collectCssText: function (rule) {
var customCssText = '';
var cssText = rule.parsedCssText;
cssText = cssText.replace(this.rx.BRACKETED, '').replace(this.rx.VAR_ASSIGN, '');
var parts = cssText.split(';');
for (var i = 0, p; i < parts.length; i++) {
p = parts[i];
if (p.match(this.rx.MIXIN_MATCH) || p.match(this.rx.VAR_MATCH)) {
customCssText += p + ';\n';
}
}
return customCssText;
},
collectPropertiesInCssText: function (cssText, props) {
var m;
while (m = this.rx.VAR_CAPTURE.exec(cssText)) {
props[m[1]] = true;
var def = m[2];
if (def && def.match(this.rx.IS_VAR)) {
props[def] = true;
}
}
},
reify: function (props) {
var names = Object.getOwnPropertyNames(props);
for (var i = 0, n; i < names.length; i++) {
n = names[i];
props[n] = this.valueForProperty(props[n], props);
}
},
valueForProperty: function (property, props) {
if (property) {
if (property.indexOf(';') >= 0) {
property = this.valueForProperties(property, props);
} else {
var self = this;
var fn = function (all, prefix, value, fallback) {
var propertyValue = self.valueForProperty(props[value], props) || (props[fallback] ? self.valueForProperty(props[fallback], props) : fallback);
return prefix + (propertyValue || '');
};
property = property.replace(this.rx.VAR_MATCH, fn);
}
}
return property && property.trim() || '';
},
valueForProperties: function (property, props) {
var parts = property.split(';');
for (var i = 0, p, m; i < parts.length; i++) {
if (p = parts[i]) {
m = p.match(this.rx.MIXIN_MATCH);
if (m) {
p = this.valueForProperty(props[m[1]], props);
} else {
var pp = p.split(':');
if (pp[1]) {
pp[1] = pp[1].trim();
pp[1] = this.valueForProperty(pp[1], props) || pp[1];
}
p = pp.join(':');
}
parts[i] = p && p.lastIndexOf(';') === p.length - 1 ? p.slice(0, -1) : p || '';
}
}
return parts.join(';');
},
applyProperties: function (rule, props) {
var output = '';
if (!rule.propertyInfo) {
this.decorateRule(rule);
}
if (rule.propertyInfo.cssText) {
output = this.valueForProperties(rule.propertyInfo.cssText, props);
}
rule.cssText = output;
},
propertyDataFromStyles: function (styles, element) {
var props = {}, self = this;
var o = [], i = 0;
styleUtil.forRulesInStyles(styles, function (rule) {
if (!rule.propertyInfo) {
self.decorateRule(rule);
}
if (element && rule.propertyInfo.properties && matchesSelector.call(element, rule.transformedSelector || rule.parsedSelector)) {
self.collectProperties(rule, props);
addToBitMask(i, o);
}
i++;
});
return {
properties: props,
key: o
};
},
scopePropertiesFromStyles: function (styles) {
if (!styles._scopeStyleProperties) {
styles._scopeStyleProperties = this.selectedPropertiesFromStyles(styles, this.SCOPE_SELECTORS);
}
return styles._scopeStyleProperties;
},
hostPropertiesFromStyles: function (styles) {
if (!styles._hostStyleProperties) {
styles._hostStyleProperties = this.selectedPropertiesFromStyles(styles, this.HOST_SELECTORS);
}
return styles._hostStyleProperties;
},
selectedPropertiesFromStyles: function (styles, selectors) {
var props = {}, self = this;
styleUtil.forRulesInStyles(styles, function (rule) {
if (!rule.propertyInfo) {
self.decorateRule(rule);
}
for (var i = 0; i < selectors.length; i++) {
if (rule.parsedSelector === selectors[i]) {
self.collectProperties(rule, props);
return;
}
}
});
return props;
},
transformStyles: function (element, properties, scopeSelector) {
var self = this;
var hostSelector = styleTransformer._calcHostScope(element.is, element.extends);
var rxHostSelector = element.extends ? '\\' + hostSelector.slice(0, -1) + '\\]' : hostSelector;
var hostRx = new RegExp(this.rx.HOST_PREFIX + rxHostSelector + this.rx.HOST_SUFFIX);
return styleTransformer.elementStyles(element, function (rule) {
self.applyProperties(rule, properties);
if (rule.cssText && !nativeShadow) {
self._scopeSelector(rule, hostRx, hostSelector, element._scopeCssViaAttr, scopeSelector);
}
});
},
_scopeSelector: function (rule, hostRx, hostSelector, viaAttr, scopeId) {
rule.transformedSelector = rule.transformedSelector || rule.selector;
var selector = rule.transformedSelector;
var scope = viaAttr ? '[' + styleTransformer.SCOPE_NAME + '~=' + scopeId + ']' : '.' + scopeId;
var parts = selector.split(',');
for (var i = 0, l = parts.length, p; i < l && (p = parts[i]); i++) {
parts[i] = p.match(hostRx) ? p.replace(hostSelector, hostSelector + scope) : scope + ' ' + p;
}
rule.selector = parts.join(',');
},
applyElementScopeSelector: function (element, selector, old, viaAttr) {
var c = viaAttr ? element.getAttribute(styleTransformer.SCOPE_NAME) : element.className;
var v = old ? c.replace(old, selector) : (c ? c + ' ' : '') + this.XSCOPE_NAME + ' ' + selector;
if (c !== v) {
if (viaAttr) {
element.setAttribute(styleTransformer.SCOPE_NAME, v);
} else {
element.className = v;
}
}
},
applyElementStyle: function (element, properties, selector, style) {
var cssText = style ? style.textContent || '' : this.transformStyles(element, properties, selector);
var s = element._customStyle;
if (s && !nativeShadow && s !== style) {
s._useCount--;
if (s._useCount <= 0 && s.parentNode) {
s.parentNode.removeChild(s);
}
}
if (nativeShadow || (!style || !style.parentNode)) {
if (nativeShadow && element._customStyle) {
element._customStyle.textContent = cssText;
style = element._customStyle;
} else if (cssText) {
style = styleUtil.applyCss(cssText, selector, nativeShadow ? element.root : null, element._scopeStyle);
}
}
if (style) {
style._useCount = style._useCount || 0;
if (element._customStyle != style) {
style._useCount++;
}
element._customStyle = style;
}
return style;
},
mixinCustomStyle: function (props, customStyle) {
var v;
for (var i in customStyle) {
v = customStyle[i];
if (v || v === 0) {
props[i] = v;
}
}
},
rx: {
VAR_ASSIGN: /(?:^|[;\n]\s*)(--[\w-]*?):\s*(?:([^;{]*)|{([^}]*)})(?:(?=[;\n])|$)/gi,
MIXIN_MATCH: /(?:^|\W+)@apply[\s]*\(([^)]*)\)/i,
VAR_MATCH: /(^|\W+)var\([\s]*([^,)]*)[\s]*,?[\s]*((?:[^,)]*)|(?:[^;]*\([^;)]*\)))[\s]*?\)/gi,
VAR_CAPTURE: /\([\s]*(--[^,\s)]*)(?:,[\s]*(--[^,\s)]*))?(?:\)|,)/gi,
IS_VAR: /^--/,
BRACKETED: /\{[^}]*\}/g,
HOST_PREFIX: '(?:^|[^.#[:])',
HOST_SUFFIX: '($|[.:[\\s>+~])'
},
HOST_SELECTORS: [':host'],
SCOPE_SELECTORS: [':root'],
XSCOPE_NAME: 'x-scope'
};
function addToBitMask(n, bits) {
var o = parseInt(n / 32);
var v = 1 << n % 32;
bits[o] = (bits[o] || 0) | v;
}
}();
(function () {
Polymer.StyleCache = function () {
this.cache = {};
};
Polymer.StyleCache.prototype = {
MAX: 100,
store: function (is, data, keyValues, keyStyles) {
data.keyValues = keyValues;
data.styles = keyStyles;
var s$ = this.cache[is] = this.cache[is] || [];
s$.push(data);
if (s$.length > this.MAX) {
s$.shift();
}
},
retrieve: function (is, keyValues, keyStyles) {
var cache = this.cache[is];
if (cache) {
for (var i = cache.length - 1, data; i >= 0; i--) {
data = cache[i];
if (keyStyles === data.styles && this._objectsEqual(keyValues, data.keyValues)) {
return data;
}
}
}
},
clear: function () {
this.cache = {};
},
_objectsEqual: function (target, source) {
var t, s;
for (var i in target) {
t = target[i], s = source[i];
if (!(typeof t === 'object' && t ? this._objectsStrictlyEqual(t, s) : t === s)) {
return false;
}
}
if (Array.isArray(target)) {
return target.length === source.length;
}
return true;
},
_objectsStrictlyEqual: function (target, source) {
return this._objectsEqual(target, source) && this._objectsEqual(source, target);
}
};
}());
Polymer.StyleDefaults = function () {
var styleProperties = Polymer.StyleProperties;
var styleUtil = Polymer.StyleUtil;
var StyleCache = Polymer.StyleCache;
var api = {
_styles: [],
_properties: null,
customStyle: {},
_styleCache: new StyleCache(),
addStyle: function (style) {
this._styles.push(style);
this._properties = null;
},
get _styleProperties() {
if (!this._properties) {
styleProperties.decorateStyles(this._styles);
this._styles._scopeStyleProperties = null;
this._properties = styleProperties.scopePropertiesFromStyles(this._styles);
styleProperties.mixinCustomStyle(this._properties, this.customStyle);
styleProperties.reify(this._properties);
}
return this._properties;
},
_needsStyleProperties: function () {
},
_computeStyleProperties: function () {
return this._styleProperties;
},
updateStyles: function (properties) {
this._properties = null;
if (properties) {
Polymer.Base.mixin(this.customStyle, properties);
}
this._styleCache.clear();
for (var i = 0, s; i < this._styles.length; i++) {
s = this._styles[i];
s = s.__importElement || s;
s._apply();
}
}
};
return api;
}();
(function () {
'use strict';
var serializeValueToAttribute = Polymer.Base.serializeValueToAttribute;
var propertyUtils = Polymer.StyleProperties;
var styleTransformer = Polymer.StyleTransformer;
var styleUtil = Polymer.StyleUtil;
var styleDefaults = Polymer.StyleDefaults;
var nativeShadow = Polymer.Settings.useNativeShadow;
Polymer.Base._addFeature({
_prepStyleProperties: function () {
this._ownStylePropertyNames = this._styles ? propertyUtils.decorateStyles(this._styles) : [];
},
customStyle: {},
_setupStyleProperties: function () {
this.customStyle = {};
},
_needsStyleProperties: function () {
return Boolean(this._ownStylePropertyNames && this._ownStylePropertyNames.length);
},
_beforeAttached: function () {
if (!this._scopeSelector && this._needsStyleProperties()) {
this._updateStyleProperties();
}
},
_findStyleHost: function () {
var e = this, root;
while (root = Polymer.dom(e).getOwnerRoot()) {
if (Polymer.isInstance(root.host)) {
return root.host;
}
e = root.host;
}
return styleDefaults;
},
_updateStyleProperties: function () {
var info, scope = this._findStyleHost();
if (!scope._styleCache) {
scope._styleCache = new Polymer.StyleCache();
}
var scopeData = propertyUtils.propertyDataFromStyles(scope._styles, this);
scopeData.key.customStyle = this.customStyle;
info = scope._styleCache.retrieve(this.is, scopeData.key, this._styles);
var scopeCached = Boolean(info);
if (scopeCached) {
this._styleProperties = info._styleProperties;
} else {
this._computeStyleProperties(scopeData.properties);
}
this._computeOwnStyleProperties();
if (!scopeCached) {
info = styleCache.retrieve(this.is, this._ownStyleProperties, this._styles);
}
var globalCached = Boolean(info) && !scopeCached;
var style = this._applyStyleProperties(info);
if (!scopeCached) {
style = style && nativeShadow ? style.cloneNode(true) : style;
info = {
style: style,
_scopeSelector: this._scopeSelector,
_styleProperties: this._styleProperties
};
scopeData.key.customStyle = {};
this.mixin(scopeData.key.customStyle, this.customStyle);
scope._styleCache.store(this.is, info, scopeData.key, this._styles);
if (!globalCached) {
styleCache.store(this.is, Object.create(info), this._ownStyleProperties, this._styles);
}
}
},
_computeStyleProperties: function (scopeProps) {
var scope = this._findStyleHost();
if (!scope._styleProperties) {
scope._computeStyleProperties();
}
var props = Object.create(scope._styleProperties);
this.mixin(props, propertyUtils.hostPropertiesFromStyles(this._styles));
scopeProps = scopeProps || propertyUtils.propertyDataFromStyles(scope._styles, this).properties;
this.mixin(props, scopeProps);
this.mixin(props, propertyUtils.scopePropertiesFromStyles(this._styles));
propertyUtils.mixinCustomStyle(props, this.customStyle);
propertyUtils.reify(props);
this._styleProperties = props;
},
_computeOwnStyleProperties: function () {
var props = {};
for (var i = 0, n; i < this._ownStylePropertyNames.length; i++) {
n = this._ownStylePropertyNames[i];
props[n] = this._styleProperties[n];
}
this._ownStyleProperties = props;
},
_scopeCount: 0,
_applyStyleProperties: function (info) {
var oldScopeSelector = this._scopeSelector;
this._scopeSelector = info ? info._scopeSelector : this.is + '-' + this.__proto__._scopeCount++;
var style = propertyUtils.applyElementStyle(this, this._styleProperties, this._scopeSelector, info && info.style);
if (!nativeShadow) {
propertyUtils.applyElementScopeSelector(this, this._scopeSelector, oldScopeSelector, this._scopeCssViaAttr);
}
return style;
},
serializeValueToAttribute: function (value, attribute, node) {
node = node || this;
if (attribute === 'class' && !nativeShadow) {
var host = node === this ? this.domHost || this.dataHost : this;
if (host) {
value = host._scopeElementClass(node, value);
}
}
node = Polymer.dom(node);
serializeValueToAttribute.call(this, value, attribute, node);
},
_scopeElementClass: function (element, selector) {
if (!nativeShadow && !this._scopeCssViaAttr) {
selector += (selector ? ' ' : '') + SCOPE_NAME + ' ' + this.is + (element._scopeSelector ? ' ' + XSCOPE_NAME + ' ' + element._scopeSelector : '');
}
return selector;
},
updateStyles: function (properties) {
if (this.isAttached) {
if (properties) {
this.mixin(this.customStyle, properties);
}
if (this._needsStyleProperties()) {
this._updateStyleProperties();
} else {
this._styleProperties = null;
}
if (this._styleCache) {
this._styleCache.clear();
}
this._updateRootStyles();
}
},
_updateRootStyles: function (root) {
root = root || this.root;
var c$ = Polymer.dom(root)._query(function (e) {
return e.shadyRoot || e.shadowRoot;
});
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.updateStyles) {
c.updateStyles();
}
}
}
});
Polymer.updateStyles = function (properties) {
styleDefaults.updateStyles(properties);
Polymer.Base._updateRootStyles(document);
};
var styleCache = new Polymer.StyleCache();
Polymer.customStyleCache = styleCache;
var SCOPE_NAME = styleTransformer.SCOPE_NAME;
var XSCOPE_NAME = propertyUtils.XSCOPE_NAME;
}());
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepAttributes();
this._prepConstructor();
this._prepTemplate();
this._prepStyles();
this._prepStyleProperties();
this._prepAnnotations();
this._prepEffects();
this._prepBehaviors();
this._prepBindings();
this._prepShady();
},
_prepBehavior: function (b) {
this._addPropertyEffects(b.properties);
this._addComplexObserverEffects(b.observers);
this._addHostAttributes(b.hostAttributes);
},
_initFeatures: function () {
this._poolContent();
this._setupConfigure();
this._setupStyleProperties();
this._pushHost();
this._stampTemplate();
this._popHost();
this._marshalAnnotationReferences();
this._setupDebouncers();
this._marshalInstanceEffects();
this._marshalHostAttributes();
this._marshalBehaviors();
this._marshalAttributes();
this._tryReady();
},
_marshalBehavior: function (b) {
this._listenListeners(b.listeners);
}
});
(function () {
var nativeShadow = Polymer.Settings.useNativeShadow;
var propertyUtils = Polymer.StyleProperties;
var styleUtil = Polymer.StyleUtil;
var cssParse = Polymer.CssParse;
var styleDefaults = Polymer.StyleDefaults;
var styleTransformer = Polymer.StyleTransformer;
Polymer({
is: 'custom-style',
extends: 'style',
properties: { include: String },
ready: function () {
this._tryApply();
},
attached: function () {
this._tryApply();
},
_tryApply: function () {
if (!this._appliesToDocument) {
if (this.parentNode && this.parentNode.localName !== 'dom-module') {
this._appliesToDocument = true;
var e = this.__appliedElement || this;
styleDefaults.addStyle(e);
if (e.textContent || this.include) {
this._apply();
} else {
var observer = new MutationObserver(function () {
observer.disconnect();
this._apply();
}.bind(this));
observer.observe(e, { childList: true });
}
}
}
},
_apply: function () {
var e = this.__appliedElement || this;
if (this.include) {
e.textContent = styleUtil.cssFromModules(this.include, true) + e.textContent;
}
if (e.textContent) {
styleUtil.forEachStyleRule(styleUtil.rulesForStyle(e), function (rule) {
styleTransformer.documentRule(rule);
});
this._applyCustomProperties(e);
}
},
_applyCustomProperties: function (element) {
this._computeStyleProperties();
var props = this._styleProperties;
var rules = styleUtil.rulesForStyle(element);
element.textContent = styleUtil.toCssText(rules, function (rule) {
var css = rule.cssText = rule.parsedCssText;
if (rule.propertyInfo && rule.propertyInfo.cssText) {
css = cssParse.removeCustomPropAssignment(css);
rule.cssText = propertyUtils.valueForProperties(css, props);
}
});
}
});
}());
Polymer.Templatizer = {
properties: { __hideTemplateChildren__: { observer: '_showHideChildren' } },
_instanceProps: Polymer.nob,
_parentPropPrefix: '_parent_',
templatize: function (template) {
if (!template._content) {
template._content = template.content;
}
if (template._content._ctor) {
this.ctor = template._content._ctor;
this._prepParentProperties(this.ctor.prototype, template);
return;
}
var archetype = Object.create(Polymer.Base);
this._customPrepAnnotations(archetype, template);
archetype._prepEffects();
this._customPrepEffects(archetype);
archetype._prepBehaviors();
archetype._prepBindings();
this._prepParentProperties(archetype, template);
archetype._notifyPath = this._notifyPathImpl;
archetype._scopeElementClass = this._scopeElementClassImpl;
archetype.listen = this._listenImpl;
archetype._showHideChildren = this._showHideChildrenImpl;
var _constructor = this._constructorImpl;
var ctor = function TemplateInstance(model, host) {
_constructor.call(this, model, host);
};
ctor.prototype = archetype;
archetype.constructor = ctor;
template._content._ctor = ctor;
this.ctor = ctor;
},
_getRootDataHost: function () {
return this.dataHost && this.dataHost._rootDataHost || this.dataHost;
},
_showHideChildrenImpl: function (hide) {
var c = this._children;
for (var i = 0; i < c.length; i++) {
var n = c[i];
if (Boolean(hide) != Boolean(n.__hideTemplateChildren__)) {
if (n.nodeType === Node.TEXT_NODE) {
if (hide) {
n.__polymerTextContent__ = n.textContent;
n.textContent = '';
} else {
n.textContent = n.__polymerTextContent__;
}
} else if (n.style) {
if (hide) {
n.__polymerDisplay__ = n.style.display;
n.style.display = 'none';
} else {
n.style.display = n.__polymerDisplay__;
}
}
}
n.__hideTemplateChildren__ = hide;
}
},
_debounceTemplate: function (fn) {
Polymer.dom.addDebouncer(this.debounce('_debounceTemplate', fn));
},
_flushTemplates: function (debouncerExpired) {
Polymer.dom.flush();
},
_customPrepEffects: function (archetype) {
var parentProps = archetype._parentProps;
for (var prop in parentProps) {
archetype._addPropertyEffect(prop, 'function', this._createHostPropEffector(prop));
}
for (var prop in this._instanceProps) {
archetype._addPropertyEffect(prop, 'function', this._createInstancePropEffector(prop));
}
},
_customPrepAnnotations: function (archetype, template) {
archetype._template = template;
var c = template._content;
if (!c._notes) {
var rootDataHost = archetype._rootDataHost;
if (rootDataHost) {
Polymer.Annotations.prepElement = rootDataHost._prepElement.bind(rootDataHost);
}
c._notes = Polymer.Annotations.parseAnnotations(template);
Polymer.Annotations.prepElement = null;
this._processAnnotations(c._notes);
}
archetype._notes = c._notes;
archetype._parentProps = c._parentProps;
},
_prepParentProperties: function (archetype, template) {
var parentProps = this._parentProps = archetype._parentProps;
if (this._forwardParentProp && parentProps) {
var proto = archetype._parentPropProto;
var prop;
if (!proto) {
for (prop in this._instanceProps) {
delete parentProps[prop];
}
proto = archetype._parentPropProto = Object.create(null);
if (template != this) {
Polymer.Bind.prepareModel(proto);
}
for (prop in parentProps) {
var parentProp = this._parentPropPrefix + prop;
var effects = [
{
kind: 'function',
effect: this._createForwardPropEffector(prop)
},
{ kind: 'notify' }
];
Polymer.Bind._createAccessors(proto, parentProp, effects);
}
}
if (template != this) {
Polymer.Bind.prepareInstance(template);
template._forwardParentProp = this._forwardParentProp.bind(this);
}
this._extendTemplate(template, proto);
}
},
_createForwardPropEffector: function (prop) {
return function (source, value) {
this._forwardParentProp(prop, value);
};
},
_createHostPropEffector: function (prop) {
var prefix = this._parentPropPrefix;
return function (source, value) {
this.dataHost[prefix + prop] = value;
};
},
_createInstancePropEffector: function (prop) {
return function (source, value, old, fromAbove) {
if (!fromAbove) {
this.dataHost._forwardInstanceProp(this, prop, value);
}
};
},
_extendTemplate: function (template, proto) {
Object.getOwnPropertyNames(proto).forEach(function (n) {
var val = template[n];
var pd = Object.getOwnPropertyDescriptor(proto, n);
Object.defineProperty(template, n, pd);
if (val !== undefined) {
template._propertySetter(n, val);
}
});
},
_showHideChildren: function (hidden) {
},
_forwardInstancePath: function (inst, path, value) {
},
_forwardInstanceProp: function (inst, prop, value) {
},
_notifyPathImpl: function (path, value) {
var dataHost = this.dataHost;
var dot = path.indexOf('.');
var root = dot < 0 ? path : path.slice(0, dot);
dataHost._forwardInstancePath.call(dataHost, this, path, value);
if (root in dataHost._parentProps) {
dataHost.notifyPath(dataHost._parentPropPrefix + path, value);
}
},
_pathEffector: function (path, value, fromAbove) {
if (this._forwardParentPath) {
if (path.indexOf(this._parentPropPrefix) === 0) {
this._forwardParentPath(path.substring(8), value);
}
}
Polymer.Base._pathEffector.apply(this, arguments);
},
_constructorImpl: function (model, host) {
this._rootDataHost = host._getRootDataHost();
this._setupConfigure(model);
this._pushHost(host);
this.root = this.instanceTemplate(this._template);
this.root.__noContent = !this._notes._hasContent;
this.root.__styleScoped = true;
this._popHost();
this._marshalAnnotatedNodes();
this._marshalInstanceEffects();
this._marshalAnnotatedListeners();
var children = [];
for (var n = this.root.firstChild; n; n = n.nextSibling) {
children.push(n);
n._templateInstance = this;
}
this._children = children;
if (host.__hideTemplateChildren__) {
this._showHideChildren(true);
}
this._tryReady();
},
_listenImpl: function (node, eventName, methodName) {
var model = this;
var host = this._rootDataHost;
var handler = host._createEventHandler(node, eventName, methodName);
var decorated = function (e) {
e.model = model;
handler(e);
};
host._listen(node, eventName, decorated);
},
_scopeElementClassImpl: function (node, value) {
var host = this._rootDataHost;
if (host) {
return host._scopeElementClass(node, value);
}
},
stamp: function (model) {
model = model || {};
if (this._parentProps) {
for (var prop in this._parentProps) {
model[prop] = this[this._parentPropPrefix + prop];
}
}
return new this.ctor(model, this);
},
modelForElement: function (el) {
var model;
while (el) {
if (model = el._templateInstance) {
if (model.dataHost != this) {
el = model.dataHost;
} else {
return model;
}
} else {
el = el.parentNode;
}
}
}
};
Polymer({
is: 'dom-template',
extends: 'template',
behaviors: [Polymer.Templatizer],
ready: function () {
this.templatize(this);
}
});
Polymer._collections = new WeakMap();
Polymer.Collection = function (userArray) {
Polymer._collections.set(userArray, this);
this.userArray = userArray;
this.store = userArray.slice();
this.initMap();
};
Polymer.Collection.prototype = {
constructor: Polymer.Collection,
initMap: function () {
var omap = this.omap = new WeakMap();
var pmap = this.pmap = {};
var s = this.store;
for (var i = 0; i < s.length; i++) {
var item = s[i];
if (item && typeof item == 'object') {
omap.set(item, i);
} else {
pmap[item] = i;
}
}
},
add: function (item) {
var key = this.store.push(item) - 1;
if (item && typeof item == 'object') {
this.omap.set(item, key);
} else {
this.pmap[item] = key;
}
return key;
},
removeKey: function (key) {
this._removeFromMap(this.store[key]);
delete this.store[key];
},
_removeFromMap: function (item) {
if (item && typeof item == 'object') {
this.omap.delete(item);
} else {
delete this.pmap[item];
}
},
remove: function (item) {
var key = this.getKey(item);
this.removeKey(key);
return key;
},
getKey: function (item) {
if (item && typeof item == 'object') {
return this.omap.get(item);
} else {
return this.pmap[item];
}
},
getKeys: function () {
return Object.keys(this.store);
},
setItem: function (key, item) {
var old = this.store[key];
if (old) {
this._removeFromMap(old);
}
if (item && typeof item == 'object') {
this.omap.set(item, key);
} else {
this.pmap[item] = key;
}
this.store[key] = item;
},
getItem: function (key) {
return this.store[key];
},
getItems: function () {
var items = [], store = this.store;
for (var key in store) {
items.push(store[key]);
}
return items;
},
_applySplices: function (splices) {
var keyMap = {}, key, i;
splices.forEach(function (s) {
s.addedKeys = [];
for (i = 0; i < s.removed.length; i++) {
key = this.getKey(s.removed[i]);
keyMap[key] = keyMap[key] ? null : -1;
}
for (i = 0; i < s.addedCount; i++) {
var item = this.userArray[s.index + i];
key = this.getKey(item);
key = key === undefined ? this.add(item) : key;
keyMap[key] = keyMap[key] ? null : 1;
s.addedKeys.push(key);
}
}, this);
var removed = [];
var added = [];
for (var key in keyMap) {
if (keyMap[key] < 0) {
this.removeKey(key);
removed.push(key);
}
if (keyMap[key] > 0) {
added.push(key);
}
}
return [{
removed: removed,
added: added
}];
}
};
Polymer.Collection.get = function (userArray) {
return Polymer._collections.get(userArray) || new Polymer.Collection(userArray);
};
Polymer.Collection.applySplices = function (userArray, splices) {
var coll = Polymer._collections.get(userArray);
return coll ? coll._applySplices(splices) : null;
};
Polymer({
is: 'dom-repeat',
extends: 'template',
properties: {
items: { type: Array },
as: {
type: String,
value: 'item'
},
indexAs: {
type: String,
value: 'index'
},
sort: {
type: Function,
observer: '_sortChanged'
},
filter: {
type: Function,
observer: '_filterChanged'
},
observe: {
type: String,
observer: '_observeChanged'
},
delay: Number
},
behaviors: [Polymer.Templatizer],
observers: ['_itemsChanged(items.*)'],
created: function () {
this._instances = [];
},
detached: function () {
for (var i = 0; i < this._instances.length; i++) {
this._detachRow(i);
}
},
attached: function () {
var parentNode = Polymer.dom(this).parentNode;
for (var i = 0; i < this._instances.length; i++) {
Polymer.dom(parentNode).insertBefore(this._instances[i].root, this);
}
},
ready: function () {
this._instanceProps = { __key__: true };
this._instanceProps[this.as] = true;
this._instanceProps[this.indexAs] = true;
if (!this.ctor) {
this.templatize(this);
}
},
_sortChanged: function () {
var dataHost = this._getRootDataHost();
var sort = this.sort;
this._sortFn = sort && (typeof sort == 'function' ? sort : function () {
return dataHost[sort].apply(dataHost, arguments);
});
this._needFullRefresh = true;
if (this.items) {
this._debounceTemplate(this._render);
}
},
_filterChanged: function () {
var dataHost = this._getRootDataHost();
var filter = this.filter;
this._filterFn = filter && (typeof filter == 'function' ? filter : function () {
return dataHost[filter].apply(dataHost, arguments);
});
this._needFullRefresh = true;
if (this.items) {
this._debounceTemplate(this._render);
}
},
_observeChanged: function () {
this._observePaths = this.observe && this.observe.replace('.*', '.').split(' ');
},
_itemsChanged: function (change) {
if (change.path == 'items') {
if (Array.isArray(this.items)) {
this.collection = Polymer.Collection.get(this.items);
} else if (!this.items) {
this.collection = null;
} else {
this._error(this._logf('dom-repeat', 'expected array for `items`,' + ' found', this.items));
}
this._keySplices = [];
this._indexSplices = [];
this._needFullRefresh = true;
this._debounceTemplate(this._render);
} else if (change.path == 'items.splices') {
this._keySplices = this._keySplices.concat(change.value.keySplices);
this._indexSplices = this._indexSplices.concat(change.value.indexSplices);
this._debounceTemplate(this._render);
} else {
var subpath = change.path.slice(6);
this._forwardItemPath(subpath, change.value);
this._checkObservedPaths(subpath);
}
},
_checkObservedPaths: function (path) {
if (this._observePaths) {
path = path.substring(path.indexOf('.') + 1);
var paths = this._observePaths;
for (var i = 0; i < paths.length; i++) {
if (path.indexOf(paths[i]) === 0) {
this._needFullRefresh = true;
if (this.delay) {
this.debounce('render', this._render, this.delay);
} else {
this._debounceTemplate(this._render);
}
return;
}
}
}
},
render: function () {
this._needFullRefresh = true;
this._debounceTemplate(this._render);
this._flushTemplates();
},
_render: function () {
var c = this.collection;
if (this._needFullRefresh) {
this._applyFullRefresh();
this._needFullRefresh = false;
} else {
if (this._sortFn) {
this._applySplicesUserSort(this._keySplices);
} else {
if (this._filterFn) {
this._applyFullRefresh();
} else {
this._applySplicesArrayOrder(this._indexSplices);
}
}
}
this._keySplices = [];
this._indexSplices = [];
var keyToIdx = this._keyToInstIdx = {};
for (var i = 0; i < this._instances.length; i++) {
var inst = this._instances[i];
keyToIdx[inst.__key__] = i;
inst.__setProperty(this.indexAs, i, true);
}
this.fire('dom-change');
},
_applyFullRefresh: function () {
var c = this.collection;
var keys;
if (this._sortFn) {
keys = c ? c.getKeys() : [];
} else {
keys = [];
var items = this.items;
if (items) {
for (var i = 0; i < items.length; i++) {
keys.push(c.getKey(items[i]));
}
}
}
if (this._filterFn) {
keys = keys.filter(function (a) {
return this._filterFn(c.getItem(a));
}, this);
}
if (this._sortFn) {
keys.sort(function (a, b) {
return this._sortFn(c.getItem(a), c.getItem(b));
}.bind(this));
}
for (var i = 0; i < keys.length; i++) {
var key = keys[i];
var inst = this._instances[i];
if (inst) {
inst.__setProperty('__key__', key, true);
inst.__setProperty(this.as, c.getItem(key), true);
} else {
this._instances.push(this._insertRow(i, key));
}
}
for (; i < this._instances.length; i++) {
this._detachRow(i);
}
this._instances.splice(keys.length, this._instances.length - keys.length);
},
_keySort: function (a, b) {
return this.collection.getKey(a) - this.collection.getKey(b);
},
_numericSort: function (a, b) {
return a - b;
},
_applySplicesUserSort: function (splices) {
var c = this.collection;
var instances = this._instances;
var keyMap = {};
var pool = [];
var sortFn = this._sortFn || this._keySort.bind(this);
splices.forEach(function (s) {
for (var i = 0; i < s.removed.length; i++) {
var key = s.removed[i];
keyMap[key] = keyMap[key] ? null : -1;
}
for (var i = 0; i < s.added.length; i++) {
var key = s.added[i];
keyMap[key] = keyMap[key] ? null : 1;
}
}, this);
var removedIdxs = [];
var addedKeys = [];
for (var key in keyMap) {
if (keyMap[key] === -1) {
removedIdxs.push(this._keyToInstIdx[key]);
}
if (keyMap[key] === 1) {
addedKeys.push(key);
}
}
if (removedIdxs.length) {
removedIdxs.sort(this._numericSort);
for (var i = removedIdxs.length - 1; i >= 0; i--) {
var idx = removedIdxs[i];
if (idx !== undefined) {
pool.push(this._detachRow(idx));
instances.splice(idx, 1);
}
}
}
if (addedKeys.length) {
if (this._filterFn) {
addedKeys = addedKeys.filter(function (a) {
return this._filterFn(c.getItem(a));
}, this);
}
addedKeys.sort(function (a, b) {
return this._sortFn(c.getItem(a), c.getItem(b));
}.bind(this));
var start = 0;
for (var i = 0; i < addedKeys.length; i++) {
start = this._insertRowUserSort(start, addedKeys[i], pool);
}
}
},
_insertRowUserSort: function (start, key, pool) {
var c = this.collection;
var item = c.getItem(key);
var end = this._instances.length - 1;
var idx = -1;
var sortFn = this._sortFn || this._keySort.bind(this);
while (start <= end) {
var mid = start + end >> 1;
var midKey = this._instances[mid].__key__;
var cmp = sortFn(c.getItem(midKey), item);
if (cmp < 0) {
start = mid + 1;
} else if (cmp > 0) {
end = mid - 1;
} else {
idx = mid;
break;
}
}
if (idx < 0) {
idx = end + 1;
}
this._instances.splice(idx, 0, this._insertRow(idx, key, pool));
return idx;
},
_applySplicesArrayOrder: function (splices) {
var pool = [];
var c = this.collection;
splices.forEach(function (s) {
for (var i = 0; i < s.removed.length; i++) {
var inst = this._detachRow(s.index + i);
if (!inst.isPlaceholder) {
pool.push(inst);
}
}
this._instances.splice(s.index, s.removed.length);
for (var i = 0; i < s.addedKeys.length; i++) {
var inst = {
isPlaceholder: true,
key: s.addedKeys[i]
};
this._instances.splice(s.index + i, 0, inst);
}
}, this);
for (var i = this._instances.length - 1; i >= 0; i--) {
var inst = this._instances[i];
if (inst.isPlaceholder) {
this._instances[i] = this._insertRow(i, inst.key, pool, true);
}
}
},
_detachRow: function (idx) {
var inst = this._instances[idx];
if (!inst.isPlaceholder) {
var parentNode = Polymer.dom(this).parentNode;
for (var i = 0; i < inst._children.length; i++) {
var el = inst._children[i];
Polymer.dom(inst.root).appendChild(el);
}
}
return inst;
},
_insertRow: function (idx, key, pool, replace) {
var inst;
if (inst = pool && pool.pop()) {
inst.__setProperty(this.as, this.collection.getItem(key), true);
inst.__setProperty('__key__', key, true);
} else {
inst = this._generateRow(idx, key);
}
var beforeRow = this._instances[replace ? idx + 1 : idx];
var beforeNode = beforeRow ? beforeRow._children[0] : this;
var parentNode = Polymer.dom(this).parentNode;
Polymer.dom(parentNode).insertBefore(inst.root, beforeNode);
return inst;
},
_generateRow: function (idx, key) {
var model = { __key__: key };
model[this.as] = this.collection.getItem(key);
model[this.indexAs] = idx;
var inst = this.stamp(model);
return inst;
},
_showHideChildren: function (hidden) {
for (var i = 0; i < this._instances.length; i++) {
this._instances[i]._showHideChildren(hidden);
}
},
_forwardInstanceProp: function (inst, prop, value) {
if (prop == this.as) {
var idx;
if (this._sortFn || this._filterFn) {
idx = this.items.indexOf(this.collection.getItem(inst.__key__));
} else {
idx = inst[this.indexAs];
}
this.set('items.' + idx, value);
}
},
_forwardInstancePath: function (inst, path, value) {
if (path.indexOf(this.as + '.') === 0) {
this.notifyPath('items.' + inst.__key__ + '.' + path.slice(this.as.length + 1), value);
}
},
_forwardParentProp: function (prop, value) {
this._instances.forEach(function (inst) {
inst.__setProperty(prop, value, true);
}, this);
},
_forwardParentPath: function (path, value) {
this._instances.forEach(function (inst) {
inst.notifyPath(path, value, true);
}, this);
},
_forwardItemPath: function (path, value) {
if (this._keyToInstIdx) {
var dot = path.indexOf('.');
var key = path.substring(0, dot < 0 ? path.length : dot);
var idx = this._keyToInstIdx[key];
var inst = this._instances[idx];
if (inst) {
if (dot >= 0) {
path = this.as + '.' + path.substring(dot + 1);
inst.notifyPath(path, value, true);
} else {
inst.__setProperty(this.as, value, true);
}
}
}
},
itemForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance[this.as];
},
keyForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance.__key__;
},
indexForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance[this.indexAs];
}
});
Polymer({
is: 'array-selector',
properties: {
items: {
type: Array,
observer: 'clearSelection'
},
multi: {
type: Boolean,
value: false,
observer: 'clearSelection'
},
selected: {
type: Object,
notify: true
},
selectedItem: {
type: Object,
notify: true
},
toggle: {
type: Boolean,
value: false
}
},
clearSelection: function () {
if (Array.isArray(this.selected)) {
for (var i = 0; i < this.selected.length; i++) {
this.unlinkPaths('selected.' + i);
}
} else {
this.unlinkPaths('selected');
}
if (this.multi) {
if (!this.selected || this.selected.length) {
this.selected = [];
this._selectedColl = Polymer.Collection.get(this.selected);
}
} else {
this.selected = null;
this._selectedColl = null;
}
this.selectedItem = null;
},
isSelected: function (item) {
if (this.multi) {
return this._selectedColl.getKey(item) !== undefined;
} else {
return this.selected == item;
}
},
deselect: function (item) {
if (this.multi) {
if (this.isSelected(item)) {
var skey = this._selectedColl.getKey(item);
this.arrayDelete('selected', item);
this.unlinkPaths('selected.' + skey);
}
} else {
this.selected = null;
this.selectedItem = null;
this.unlinkPaths('selected');
this.unlinkPaths('selectedItem');
}
},
select: function (item) {
var icol = Polymer.Collection.get(this.items);
var key = icol.getKey(item);
if (this.multi) {
if (this.isSelected(item)) {
if (this.toggle) {
this.deselect(item);
}
} else {
this.push('selected', item);
skey = this._selectedColl.getKey(item);
this.linkPaths('selected.' + skey, 'items.' + key);
}
} else {
if (this.toggle && item == this.selected) {
this.deselect();
} else {
this.selected = item;
this.selectedItem = item;
this.linkPaths('selected', 'items.' + key);
this.linkPaths('selectedItem', 'items.' + key);
}
}
}
});
Polymer({
is: 'dom-if',
extends: 'template',
properties: {
'if': {
type: Boolean,
value: false,
observer: '_queueRender'
},
restamp: {
type: Boolean,
value: false,
observer: '_queueRender'
}
},
behaviors: [Polymer.Templatizer],
_queueRender: function () {
this._debounceTemplate(this._render);
},
detached: function () {
this._teardownInstance();
},
attached: function () {
if (this.if && this.ctor) {
this.async(this._ensureInstance);
}
},
render: function () {
this._flushTemplates();
},
_render: function () {
if (this.if) {
if (!this.ctor) {
this.templatize(this);
}
this._ensureInstance();
this._showHideChildren();
} else if (this.restamp) {
this._teardownInstance();
}
if (!this.restamp && this._instance) {
this._showHideChildren();
}
if (this.if != this._lastIf) {
this.fire('dom-change');
this._lastIf = this.if;
}
},
_ensureInstance: function () {
if (!this._instance) {
this._instance = this.stamp();
var root = this._instance.root;
var parent = Polymer.dom(Polymer.dom(this).parentNode);
parent.insertBefore(root, this);
}
},
_teardownInstance: function () {
if (this._instance) {
var c = this._instance._children;
if (c) {
var parent = Polymer.dom(Polymer.dom(c[0]).parentNode);
c.forEach(function (n) {
parent.removeChild(n);
});
}
this._instance = null;
}
},
_showHideChildren: function () {
var hidden = this.__hideTemplateChildren__ || !this.if;
if (this._instance) {
this._instance._showHideChildren(hidden);
}
},
_forwardParentProp: function (prop, value) {
if (this._instance) {
this._instance[prop] = value;
}
},
_forwardParentPath: function (path, value) {
if (this._instance) {
this._instance.notifyPath(path, value, true);
}
}
});
Polymer({
is: 'dom-bind',
extends: 'template',
created: function () {
Polymer.RenderStatus.whenReady(this._markImportsReady.bind(this));
},
_ensureReady: function () {
if (!this._readied) {
this._readySelf();
}
},
_markImportsReady: function () {
this._importsReady = true;
this._ensureReady();
},
_registerFeatures: function () {
this._prepConstructor();
},
_insertChildren: function () {
var parentDom = Polymer.dom(Polymer.dom(this).parentNode);
parentDom.insertBefore(this.root, this);
},
_removeChildren: function () {
if (this._children) {
for (var i = 0; i < this._children.length; i++) {
this.root.appendChild(this._children[i]);
}
}
},
_initFeatures: function () {
},
_scopeElementClass: function (element, selector) {
if (this.dataHost) {
return this.dataHost._scopeElementClass(element, selector);
} else {
return selector;
}
},
_prepConfigure: function () {
var config = {};
for (var prop in this._propertyEffects) {
config[prop] = this[prop];
}
this._setupConfigure = this._setupConfigure.bind(this, config);
},
attached: function () {
if (this._importsReady) {
this.render();
}
},
detached: function () {
this._removeChildren();
},
render: function () {
this._ensureReady();
if (!this._children) {
this._template = this;
this._prepAnnotations();
this._prepEffects();
this._prepBehaviors();
this._prepConfigure();
this._prepBindings();
Polymer.Base._initFeatures.call(this);
this._children = Array.prototype.slice.call(this.root.childNodes);
}
this._insertChildren();
this.fire('dom-change');
}
});
;Polymer({
is: 'iron-media-query',
properties: {
queryMatches: {
type: Boolean,
value: false,
readOnly: true,
notify: true
},
query: {
type: String,
observer: 'queryChanged'
}
},
created: function () {
this._mqHandler = this.queryHandler.bind(this);
},
queryChanged: function (query) {
if (this._mq) {
this._mq.removeListener(this._mqHandler);
}
if (query[0] !== '(') {
query = '(' + query + ')';
}
this._mq = window.matchMedia(query);
this._mq.addListener(this._mqHandler);
this.queryHandler(this._mq);
},
queryHandler: function (mq) {
this._setQueryMatches(mq.matches);
}
});
;Polymer.IronSelection = function (selectCallback) {
this.selection = [];
this.selectCallback = selectCallback;
};
Polymer.IronSelection.prototype = {
get: function () {
return this.multi ? this.selection : this.selection[0];
},
clear: function (excludes) {
this.selection.slice().forEach(function (item) {
if (!excludes || excludes.indexOf(item) < 0) {
this.setItemSelected(item, false);
}
}, this);
},
isSelected: function (item) {
return this.selection.indexOf(item) >= 0;
},
setItemSelected: function (item, isSelected) {
if (item != null) {
if (isSelected) {
this.selection.push(item);
} else {
var i = this.selection.indexOf(item);
if (i >= 0) {
this.selection.splice(i, 1);
}
}
if (this.selectCallback) {
this.selectCallback(item, isSelected);
}
}
},
select: function (item) {
if (this.multi) {
this.toggle(item);
} else if (this.get() !== item) {
this.setItemSelected(this.get(), false);
this.setItemSelected(item, true);
}
},
toggle: function (item) {
this.setItemSelected(item, !this.isSelected(item));
}
};
;Polymer.IronSelectableBehavior = {
properties: {
attrForSelected: {
type: String,
value: null
},
selected: {
type: String,
notify: true
},
selectedItem: {
type: Object,
readOnly: true,
notify: true
},
activateEvent: {
type: String,
value: 'tap',
observer: '_activateEventChanged'
},
selectable: String,
selectedClass: {
type: String,
value: 'iron-selected'
},
selectedAttribute: {
type: String,
value: null
},
excludedLocalNames: {
type: Object,
value: function () {
return { 'template': 1 };
}
}
},
observers: ['_updateSelected(attrForSelected, selected)'],
created: function () {
this._bindFilterItem = this._filterItem.bind(this);
this._selection = new Polymer.IronSelection(this._applySelection.bind(this));
},
attached: function () {
this._observer = this._observeItems(this);
this._contentObserver = this._observeContent(this);
},
detached: function () {
if (this._observer) {
this._observer.disconnect();
}
if (this._contentObserver) {
this._contentObserver.disconnect();
}
this._removeListener(this.activateEvent);
},
get items() {
var nodes = Polymer.dom(this).queryDistributedElements(this.selectable || '*');
return Array.prototype.filter.call(nodes, this._bindFilterItem);
},
indexOf: function (item) {
return this.items.indexOf(item);
},
select: function (value) {
this.selected = value;
},
selectPrevious: function () {
var length = this.items.length;
var index = (Number(this._valueToIndex(this.selected)) - 1 + length) % length;
this.selected = this._indexToValue(index);
},
selectNext: function () {
var index = (Number(this._valueToIndex(this.selected)) + 1) % this.items.length;
this.selected = this._indexToValue(index);
},
_addListener: function (eventName) {
this.listen(this, eventName, '_activateHandler');
},
_removeListener: function (eventName) {
this.unlisten(this, eventName, '_activateHandler');
},
_activateEventChanged: function (eventName, old) {
this._removeListener(old);
this._addListener(eventName);
},
_updateSelected: function () {
this._selectSelected(this.selected);
},
_selectSelected: function (selected) {
this._selection.select(this._valueToItem(this.selected));
},
_filterItem: function (node) {
return !this.excludedLocalNames[node.localName];
},
_valueToItem: function (value) {
return value == null ? null : this.items[this._valueToIndex(value)];
},
_valueToIndex: function (value) {
if (this.attrForSelected) {
for (var i = 0, item; item = this.items[i]; i++) {
if (this._valueForItem(item) == value) {
return i;
}
}
} else {
return Number(value);
}
},
_indexToValue: function (index) {
if (this.attrForSelected) {
var item = this.items[index];
if (item) {
return this._valueForItem(item);
}
} else {
return index;
}
},
_valueForItem: function (item) {
return item[this.attrForSelected] || item.getAttribute(this.attrForSelected);
},
_applySelection: function (item, isSelected) {
if (this.selectedClass) {
this.toggleClass(this.selectedClass, isSelected, item);
}
if (this.selectedAttribute) {
this.toggleAttribute(this.selectedAttribute, isSelected, item);
}
this._selectionChange();
this.fire('iron-' + (isSelected ? 'select' : 'deselect'), { item: item });
},
_selectionChange: function () {
this._setSelectedItem(this._selection.get());
},
_observeContent: function (node) {
var content = node.querySelector('content');
if (content && content.parentElement === node) {
return this._observeItems(node.domHost);
}
},
_observeItems: function (node) {
var observer = new MutationObserver(function () {
if (this.selected != null) {
this._updateSelected();
}
}.bind(this));
observer.observe(node, {
childList: true,
subtree: true
});
return observer;
},
_activateHandler: function (e) {
var t = e.target;
var items = this.items;
while (t && t != this) {
var i = items.indexOf(t);
if (i >= 0) {
var value = this._indexToValue(i);
this._itemActivate(value, t);
return;
}
t = t.parentNode;
}
},
_itemActivate: function (value, item) {
if (!this.fire('iron-activate', {
selected: value,
item: item
}, { cancelable: true }).defaultPrevented) {
this.select(value);
}
}
};
;Polymer.IronMultiSelectableBehaviorImpl = {
properties: {
multi: {
type: Boolean,
value: false,
observer: 'multiChanged'
},
selectedValues: {
type: Array,
notify: true
},
selectedItems: {
type: Array,
readOnly: true,
notify: true
}
},
observers: ['_updateSelected(attrForSelected, selectedValues)'],
select: function (value) {
if (this.multi) {
if (this.selectedValues) {
this._toggleSelected(value);
} else {
this.selectedValues = [value];
}
} else {
this.selected = value;
}
},
multiChanged: function (multi) {
this._selection.multi = multi;
},
_updateSelected: function () {
if (this.multi) {
this._selectMulti(this.selectedValues);
} else {
this._selectSelected(this.selected);
}
},
_selectMulti: function (values) {
this._selection.clear();
if (values) {
for (var i = 0; i < values.length; i++) {
this._selection.setItemSelected(this._valueToItem(values[i]), true);
}
}
},
_selectionChange: function () {
var s = this._selection.get();
if (this.multi) {
this._setSelectedItems(s);
} else {
this._setSelectedItems([s]);
this._setSelectedItem(s);
}
},
_toggleSelected: function (value) {
var i = this.selectedValues.indexOf(value);
var unselected = i < 0;
if (unselected) {
this.selectedValues.push(value);
} else {
this.selectedValues.splice(i, 1);
}
this._selection.setItemSelected(this._valueToItem(value), unselected);
}
};
Polymer.IronMultiSelectableBehavior = [
Polymer.IronSelectableBehavior,
Polymer.IronMultiSelectableBehaviorImpl
];
;Polymer({
is: 'iron-selector',
behaviors: [Polymer.IronMultiSelectableBehavior]
});
;function MakePromise(asap) {
function Promise(fn) {
if (typeof this !== 'object' || typeof fn !== 'function')
throw new TypeError();
this._state = null;
this._value = null;
this._deferreds = [];
doResolve(fn, resolve.bind(this), reject.bind(this));
}
function handle(deferred) {
var me = this;
if (this._state === null) {
this._deferreds.push(deferred);
return;
}
asap(function () {
var cb = me._state ? deferred.onFulfilled : deferred.onRejected;
if (typeof cb !== 'function') {
(me._state ? deferred.resolve : deferred.reject)(me._value);
return;
}
var ret;
try {
ret = cb(me._value);
} catch (e) {
deferred.reject(e);
return;
}
deferred.resolve(ret);
});
}
function resolve(newValue) {
try {
if (newValue === this)
throw new TypeError();
if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
var then = newValue.then;
if (typeof then === 'function') {
doResolve(then.bind(newValue), resolve.bind(this), reject.bind(this));
return;
}
}
this._state = true;
this._value = newValue;
finale.call(this);
} catch (e) {
reject.call(this, e);
}
}
function reject(newValue) {
this._state = false;
this._value = newValue;
finale.call(this);
}
function finale() {
for (var i = 0, len = this._deferreds.length; i < len; i++) {
handle.call(this, this._deferreds[i]);
}
this._deferreds = null;
}
function doResolve(fn, onFulfilled, onRejected) {
var done = false;
try {
fn(function (value) {
if (done)
return;
done = true;
onFulfilled(value);
}, function (reason) {
if (done)
return;
done = true;
onRejected(reason);
});
} catch (ex) {
if (done)
return;
done = true;
onRejected(ex);
}
}
Promise.prototype['catch'] = function (onRejected) {
return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
var me = this;
return new Promise(function (resolve, reject) {
handle.call(me, {
onFulfilled: onFulfilled,
onRejected: onRejected,
resolve: resolve,
reject: reject
});
});
};
Promise.resolve = function (value) {
if (value && typeof value === 'object' && value.constructor === Promise) {
return value;
}
return new Promise(function (resolve) {
resolve(value);
});
};
Promise.reject = function (value) {
return new Promise(function (resolve, reject) {
reject(value);
});
};
return Promise;
}
if (typeof module !== 'undefined') {
module.exports = MakePromise;
}
;if (!window.Promise) {
window.Promise = MakePromise(Polymer.Base.async);
}
;'use strict';
Polymer({
is: 'iron-request',
properties: {
xhr: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return new XMLHttpRequest();
}
},
response: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return null;
}
},
status: {
type: Number,
notify: true,
readOnly: true,
value: 0
},
statusText: {
type: String,
notify: true,
readOnly: true,
value: ''
},
completes: {
type: Object,
readOnly: true,
notify: true,
value: function () {
return new Promise(function (resolve, reject) {
this.resolveCompletes = resolve;
this.rejectCompletes = reject;
}.bind(this));
}
},
progress: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return {};
}
},
aborted: {
type: Boolean,
notify: true,
readOnly: true,
value: false
}
},
get succeeded() {
var status = this.xhr.status || 0;
return status === 0 || status >= 200 && status < 300;
},
send: function (options) {
var xhr = this.xhr;
if (xhr.readyState > 0) {
return null;
}
xhr.addEventListener('readystatechange', function () {
if (xhr.readyState === 4 && !this.aborted) {
this._updateStatus();
if (!this.succeeded) {
this.rejectCompletes(new Error('The request failed with status code: ' + this.xhr.status));
return;
}
this._setResponse(this.parseResponse());
this.resolveCompletes(this);
}
}.bind(this));
xhr.addEventListener('progress', function (progress) {
this._setProgress({
lengthComputable: progress.lengthComputable,
loaded: progress.loaded,
total: progress.total
});
}.bind(this));
xhr.addEventListener('error', function (error) {
this._updateStatus();
this.rejectCompletes(error);
}.bind(this));
xhr.addEventListener('abort', function () {
this._updateStatus();
this.rejectCompletes(new Error('Request aborted.'));
}.bind(this));
xhr.open(options.method || 'GET', options.url, options.async !== false);
if (options.headers) {
Object.keys(options.headers).forEach(function (requestHeader) {
xhr.setRequestHeader(requestHeader, options.headers[requestHeader]);
}, this);
}
var contentType;
if (options.headers) {
contentType = options.headers['Content-Type'];
}
var body = this._encodeBodyObject(options.body, contentType);
xhr.responseType = xhr._responseType = options.handleAs || 'text';
xhr.withCredentials = !!options.withCredentials;
xhr.send(body);
return this.completes;
},
parseResponse: function () {
var xhr = this.xhr;
var responseType = this.xhr.responseType || this.xhr._responseType;
var preferResponseText = !this.xhr.responseType;
try {
switch (responseType) {
case 'json':
if (preferResponseText || xhr.response === undefined) {
try {
xhr.responseText;
} catch (e) {
return xhr.response;
}
if (xhr.responseText) {
return JSON.parse(xhr.responseText);
}
}
return xhr.response;
case 'xml':
return xhr.responseXML;
case 'blob':
case 'document':
case 'arraybuffer':
return xhr.response;
case 'text':
default:
return xhr.responseText;
}
} catch (e) {
this.rejectCompletes(new Error('Could not parse response. ' + e.message));
}
},
abort: function () {
this._setAborted(true);
this.xhr.abort();
},
_encodeBodyObject: function (body, contentType) {
if (typeof body == 'string') {
return body;
}
var bodyObj = body;
switch (contentType) {
case 'application/json':
return JSON.stringify(bodyObj);
case 'application/x-www-form-urlencoded':
return this._wwwFormUrlEncode(bodyObj);
}
return body;
},
_wwwFormUrlEncode: function (object) {
if (!object) {
return '';
}
var pieces = [];
Object.keys(object).forEach(function (key) {
pieces.push(this._wwwFormUrlEncodePiece(key) + '=' + this._wwwFormUrlEncodePiece(object[key]));
}, this);
return pieces.join('&');
},
_wwwFormUrlEncodePiece: function (str) {
return encodeURIComponent(str.toString().replace(/\r?\n/g, '\r\n')).replace(/%20/g, '+');
},
_updateStatus: function () {
this._setStatus(this.xhr.status);
this._setStatusText(this.xhr.statusText === undefined ? '' : this.xhr.statusText);
}
});
;'use strict';
Polymer({
is: 'iron-ajax',
properties: {
url: {
type: String,
value: ''
},
params: {
type: Object,
value: function () {
return {};
}
},
method: {
type: String,
value: 'GET'
},
headers: {
type: Object,
value: function () {
return {};
}
},
contentType: {
type: String,
value: null
},
body: {
type: Object,
value: null
},
sync: {
type: Boolean,
value: false
},
handleAs: {
type: String,
value: 'json'
},
withCredentials: {
type: Boolean,
value: false
},
auto: {
type: Boolean,
value: false
},
verbose: {
type: Boolean,
value: false
},
loading: {
type: Boolean,
notify: true,
readOnly: true
},
lastRequest: {
type: Object,
notify: true,
readOnly: true
},
lastResponse: {
type: Object,
notify: true,
readOnly: true
},
lastError: {
type: Object,
notify: true,
readOnly: true
},
activeRequests: {
type: Array,
notify: true,
readOnly: true,
value: function () {
return [];
}
},
debounceDuration: {
type: Number,
value: 0,
notify: true
},
_boundHandleResponse: {
type: Function,
value: function () {
return this._handleResponse.bind(this);
}
}
},
observers: ['_requestOptionsChanged(url, method, params, headers,' + 'contentType, body, sync, handleAs, withCredentials, auto)'],
get queryString() {
var queryParts = [];
var param;
var value;
for (param in this.params) {
value = this.params[param];
param = window.encodeURIComponent(param);
if (value !== null) {
param += '=' + window.encodeURIComponent(value);
}
queryParts.push(param);
}
return queryParts.join('&');
},
get requestUrl() {
var queryString = this.queryString;
if (queryString) {
return this.url + '?' + queryString;
}
return this.url;
},
get requestHeaders() {
var headers = {};
var contentType = this.contentType;
if (contentType == null && typeof this.body === 'string') {
contentType = 'application/x-www-form-urlencoded';
}
if (contentType) {
headers['Content-Type'] = contentType;
}
var header;
if (this.headers instanceof Object) {
for (header in this.headers) {
headers[header] = this.headers[header].toString();
}
}
return headers;
},
toRequestOptions: function () {
return {
url: this.requestUrl,
method: this.method,
headers: this.requestHeaders,
body: this.body,
async: !this.sync,
handleAs: this.handleAs,
withCredentials: this.withCredentials
};
},
generateRequest: function () {
var request = document.createElement('iron-request');
var requestOptions = this.toRequestOptions();
this.activeRequests.push(request);
request.completes.then(this._boundHandleResponse).catch(this._handleError.bind(this, request)).then(this._discardRequest.bind(this, request));
request.send(requestOptions);
this._setLastRequest(request);
this._setLoading(true);
this.fire('request', {
request: request,
options: requestOptions
});
return request;
},
_handleResponse: function (request) {
this._setLastResponse(request.response);
this.fire('response', request);
},
_handleError: function (request, error) {
if (this.verbose) {
console.error(error);
}
this._setLastError({
request: request,
error: error
});
this.fire('error', {
request: request,
error: error
});
},
_discardRequest: function (request) {
var requestIndex = this.activeRequests.indexOf(request);
if (requestIndex > -1) {
this.activeRequests.splice(requestIndex, 1);
}
if (this.activeRequests.length === 0) {
this._setLoading(false);
}
},
_requestOptionsChanged: function () {
this.debounce('generate-request', function () {
if (!this.url && this.url !== '') {
return;
}
if (this.auto) {
this.generateRequest();
}
}, this.debounceDuration);
}
});
;(function () {
'use strict';
var KEY_IDENTIFIER = {
'U+0009': 'tab',
'U+001B': 'esc',
'U+0020': 'space',
'U+002A': '*',
'U+0030': '0',
'U+0031': '1',
'U+0032': '2',
'U+0033': '3',
'U+0034': '4',
'U+0035': '5',
'U+0036': '6',
'U+0037': '7',
'U+0038': '8',
'U+0039': '9',
'U+0041': 'a',
'U+0042': 'b',
'U+0043': 'c',
'U+0044': 'd',
'U+0045': 'e',
'U+0046': 'f',
'U+0047': 'g',
'U+0048': 'h',
'U+0049': 'i',
'U+004A': 'j',
'U+004B': 'k',
'U+004C': 'l',
'U+004D': 'm',
'U+004E': 'n',
'U+004F': 'o',
'U+0050': 'p',
'U+0051': 'q',
'U+0052': 'r',
'U+0053': 's',
'U+0054': 't',
'U+0055': 'u',
'U+0056': 'v',
'U+0057': 'w',
'U+0058': 'x',
'U+0059': 'y',
'U+005A': 'z',
'U+007F': 'del'
};
var KEY_CODE = {
9: 'tab',
13: 'enter',
27: 'esc',
33: 'pageup',
34: 'pagedown',
35: 'end',
36: 'home',
32: 'space',
37: 'left',
38: 'up',
39: 'right',
40: 'down',
46: 'del',
106: '*'
};
var MODIFIER_KEYS = {
'shift': 'shiftKey',
'ctrl': 'ctrlKey',
'alt': 'altKey',
'meta': 'metaKey'
};
var KEY_CHAR = /[a-z0-9*]/;
var IDENT_CHAR = /U\+/;
var ARROW_KEY = /^arrow/;
var SPACE_KEY = /^space(bar)?/;
function transformKey(key) {
var validKey = '';
if (key) {
var lKey = key.toLowerCase();
if (lKey.length == 1) {
if (KEY_CHAR.test(lKey)) {
validKey = lKey;
}
} else if (ARROW_KEY.test(lKey)) {
validKey = lKey.replace('arrow', '');
} else if (SPACE_KEY.test(lKey)) {
validKey = 'space';
} else if (lKey == 'multiply') {
validKey = '*';
} else {
validKey = lKey;
}
}
return validKey;
}
function transformKeyIdentifier(keyIdent) {
var validKey = '';
if (keyIdent) {
if (IDENT_CHAR.test(keyIdent)) {
validKey = KEY_IDENTIFIER[keyIdent];
} else {
validKey = keyIdent.toLowerCase();
}
}
return validKey;
}
function transformKeyCode(keyCode) {
var validKey = '';
if (Number(keyCode)) {
if (keyCode >= 65 && keyCode <= 90) {
validKey = String.fromCharCode(32 + keyCode);
} else if (keyCode >= 112 && keyCode <= 123) {
validKey = 'f' + (keyCode - 112);
} else if (keyCode >= 48 && keyCode <= 57) {
validKey = String(48 - keyCode);
} else if (keyCode >= 96 && keyCode <= 105) {
validKey = String(96 - keyCode);
} else {
validKey = KEY_CODE[keyCode];
}
}
return validKey;
}
function normalizedKeyForEvent(keyEvent) {
return transformKey(keyEvent.key) || transformKeyIdentifier(keyEvent.keyIdentifier) || transformKeyCode(keyEvent.keyCode) || transformKey(keyEvent.detail.key) || '';
}
function keyComboMatchesEvent(keyCombo, keyEvent) {
return normalizedKeyForEvent(keyEvent) === keyCombo.key && !!keyEvent.shiftKey === !!keyCombo.shiftKey && !!keyEvent.ctrlKey === !!keyCombo.ctrlKey && !!keyEvent.altKey === !!keyCombo.altKey && !!keyEvent.metaKey === !!keyCombo.metaKey;
}
function parseKeyComboString(keyComboString) {
return keyComboString.split('+').reduce(function (parsedKeyCombo, keyComboPart) {
var eventParts = keyComboPart.split(':');
var keyName = eventParts[0];
var event = eventParts[1];
if (keyName in MODIFIER_KEYS) {
parsedKeyCombo[MODIFIER_KEYS[keyName]] = true;
} else {
parsedKeyCombo.key = keyName;
parsedKeyCombo.event = event || 'keydown';
}
return parsedKeyCombo;
}, { combo: keyComboString.split(':').shift() });
}
function parseEventString(eventString) {
return eventString.split(' ').map(function (keyComboString) {
return parseKeyComboString(keyComboString);
});
}
Polymer.IronA11yKeysBehavior = {
properties: {
keyEventTarget: {
type: Object,
value: function () {
return this;
}
},
_boundKeyHandlers: {
type: Array,
value: function () {
return [];
}
},
_imperativeKeyBindings: {
type: Object,
value: function () {
return {};
}
}
},
observers: ['_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)'],
keyBindings: {},
registered: function () {
this._prepKeyBindings();
},
attached: function () {
this._listenKeyEventListeners();
},
detached: function () {
this._unlistenKeyEventListeners();
},
addOwnKeyBinding: function (eventString, handlerName) {
this._imperativeKeyBindings[eventString] = handlerName;
this._prepKeyBindings();
this._resetKeyEventListeners();
},
removeOwnKeyBindings: function () {
this._imperativeKeyBindings = {};
this._prepKeyBindings();
this._resetKeyEventListeners();
},
keyboardEventMatchesKeys: function (event, eventString) {
var keyCombos = parseEventString(eventString);
var index;
for (index = 0; index < keyCombos.length; ++index) {
if (keyComboMatchesEvent(keyCombos[index], event)) {
return true;
}
}
return false;
},
_collectKeyBindings: function () {
var keyBindings = this.behaviors.map(function (behavior) {
return behavior.keyBindings;
});
if (keyBindings.indexOf(this.keyBindings) === -1) {
keyBindings.push(this.keyBindings);
}
return keyBindings;
},
_prepKeyBindings: function () {
this._keyBindings = {};
this._collectKeyBindings().forEach(function (keyBindings) {
for (var eventString in keyBindings) {
this._addKeyBinding(eventString, keyBindings[eventString]);
}
}, this);
for (var eventString in this._imperativeKeyBindings) {
this._addKeyBinding(eventString, this._imperativeKeyBindings[eventString]);
}
},
_addKeyBinding: function (eventString, handlerName) {
parseEventString(eventString).forEach(function (keyCombo) {
this._keyBindings[keyCombo.event] = this._keyBindings[keyCombo.event] || [];
this._keyBindings[keyCombo.event].push([
keyCombo,
handlerName
]);
}, this);
},
_resetKeyEventListeners: function () {
this._unlistenKeyEventListeners();
if (this.isAttached) {
this._listenKeyEventListeners();
}
},
_listenKeyEventListeners: function () {
Object.keys(this._keyBindings).forEach(function (eventName) {
var keyBindings = this._keyBindings[eventName];
var boundKeyHandler = this._onKeyBindingEvent.bind(this, keyBindings);
this._boundKeyHandlers.push([
this.keyEventTarget,
eventName,
boundKeyHandler
]);
this.keyEventTarget.addEventListener(eventName, boundKeyHandler);
}, this);
},
_unlistenKeyEventListeners: function () {
var keyHandlerTuple;
var keyEventTarget;
var eventName;
var boundKeyHandler;
while (this._boundKeyHandlers.length) {
keyHandlerTuple = this._boundKeyHandlers.pop();
keyEventTarget = keyHandlerTuple[0];
eventName = keyHandlerTuple[1];
boundKeyHandler = keyHandlerTuple[2];
keyEventTarget.removeEventListener(eventName, boundKeyHandler);
}
},
_onKeyBindingEvent: function (keyBindings, event) {
keyBindings.forEach(function (keyBinding) {
var keyCombo = keyBinding[0];
var handlerName = keyBinding[1];
if (!event.defaultPrevented && keyComboMatchesEvent(keyCombo, event)) {
this._triggerKeyHandler(keyCombo, handlerName, event);
}
}, this);
},
_triggerKeyHandler: function (keyCombo, handlerName, keyboardEvent) {
var detail = Object.create(keyCombo);
detail.keyboardEvent = keyboardEvent;
this[handlerName].call(this, new CustomEvent(keyCombo.event, { detail: detail }));
}
};
}());
;Polymer.IronMenuBehaviorImpl = {
properties: {
focusedItem: {
observer: '_focusedItemChanged',
readOnly: true,
type: Object
},
attrForItemTitle: { type: String }
},
hostAttributes: {
'role': 'menu',
'tabindex': '0'
},
observers: ['_updateMultiselectable(multi)'],
listeners: {
'focus': '_onFocus',
'keydown': '_onKeydown'
},
keyBindings: {
'up': '_onUpKey',
'down': '_onDownKey',
'esc': '_onEscKey',
'enter': '_onEnterKey',
'shift+tab:keydown': '_onShiftTabDown'
},
_updateMultiselectable: function (multi) {
if (multi) {
this.setAttribute('aria-multiselectable', 'true');
} else {
this.removeAttribute('aria-multiselectable');
}
},
_onShiftTabDown: function () {
var oldTabIndex;
Polymer.IronMenuBehaviorImpl._shiftTabPressed = true;
oldTabIndex = this.getAttribute('tabindex');
this.setAttribute('tabindex', '-1');
this.async(function () {
this.setAttribute('tabindex', oldTabIndex);
Polymer.IronMenuBehaviorImpl._shiftTabPressed = false;
}, 1);
},
_applySelection: function (item, isSelected) {
if (isSelected) {
item.setAttribute('aria-selected', 'true');
} else {
item.removeAttribute('aria-selected');
}
Polymer.IronSelectableBehavior._applySelection.apply(this, arguments);
},
_focusedItemChanged: function (focusedItem, old) {
old && old.setAttribute('tabindex', '-1');
if (focusedItem) {
focusedItem.setAttribute('tabindex', '0');
focusedItem.focus();
}
},
select: function (value) {
if (this._defaultFocusAsync) {
this.cancelAsync(this._defaultFocusAsync);
this._defaultFocusAsync = null;
}
var item = this._valueToItem(value);
if (item && item.hasAttribute('disabled'))
return;
this._setFocusedItem(item);
Polymer.IronMultiSelectableBehaviorImpl.select.apply(this, arguments);
},
_onFocus: function (event) {
if (Polymer.IronMenuBehaviorImpl._shiftTabPressed) {
return;
}
this.blur();
this._setFocusedItem(null);
this._defaultFocusAsync = this.async(function () {
var selectedItem = this.multi ? this.selectedItems && this.selectedItems[0] : this.selectedItem;
if (selectedItem) {
this._setFocusedItem(selectedItem);
} else {
this._setFocusedItem(this.items[0]);
}
}, 100);
},
_onUpKey: function () {
this._focusPrevious();
},
_onDownKey: function () {
this._focusNext();
},
_onEscKey: function () {
this.focusedItem.blur();
},
_onEnterKey: function (event) {
this._activateFocused(event.detail.keyboardEvent);
},
_onKeydown: function (event) {
if (this.keyboardEventMatchesKeys(event, 'up down esc enter')) {
return;
}
this._focusWithKeyboardEvent(event);
},
_focusWithKeyboardEvent: function (event) {
for (var i = 0, item; item = this.items[i]; i++) {
var attr = this.attrForItemTitle || 'textContent';
var title = item[attr] || item.getAttribute(attr);
if (title && title.trim().charAt(0).toLowerCase() === String.fromCharCode(event.keyCode).toLowerCase()) {
this._setFocusedItem(item);
break;
}
}
},
_activateFocused: function (event) {
if (!this.focusedItem.hasAttribute('disabled')) {
this._activateHandler(event);
}
},
_focusPrevious: function () {
var length = this.items.length;
var index = (Number(this.indexOf(this.focusedItem)) - 1 + length) % length;
this._setFocusedItem(this.items[index]);
},
_focusNext: function () {
var index = (Number(this.indexOf(this.focusedItem)) + 1) % this.items.length;
this._setFocusedItem(this.items[index]);
}
};
Polymer.IronMenuBehaviorImpl._shiftTabPressed = false;
Polymer.IronMenuBehavior = [
Polymer.IronMultiSelectableBehavior,
Polymer.IronA11yKeysBehavior,
Polymer.IronMenuBehaviorImpl
];
;(function () {
var metaDatas = {};
var metaArrays = {};
Polymer.IronMeta = Polymer({
is: 'iron-meta',
properties: {
type: {
type: String,
value: 'default',
observer: '_typeChanged'
},
key: {
type: String,
observer: '_keyChanged'
},
value: {
type: Object,
notify: true,
observer: '_valueChanged'
},
self: {
type: Boolean,
observer: '_selfChanged'
},
list: {
type: Array,
notify: true
}
},
factoryImpl: function (config) {
if (config) {
for (var n in config) {
switch (n) {
case 'type':
case 'key':
case 'value':
this[n] = config[n];
break;
}
}
}
},
created: function () {
this._metaDatas = metaDatas;
this._metaArrays = metaArrays;
},
_keyChanged: function (key, old) {
this._resetRegistration(old);
},
_valueChanged: function (value) {
this._resetRegistration(this.key);
},
_selfChanged: function (self) {
if (self) {
this.value = this;
}
},
_typeChanged: function (type) {
this._unregisterKey(this.key);
if (!metaDatas[type]) {
metaDatas[type] = {};
}
this._metaData = metaDatas[type];
if (!metaArrays[type]) {
metaArrays[type] = [];
}
this.list = metaArrays[type];
this._registerKeyValue(this.key, this.value);
},
byKey: function (key) {
return this._metaData && this._metaData[key];
},
_resetRegistration: function (oldKey) {
this._unregisterKey(oldKey);
this._registerKeyValue(this.key, this.value);
},
_unregisterKey: function (key) {
this._unregister(key, this._metaData, this.list);
},
_registerKeyValue: function (key, value) {
this._register(key, value, this._metaData, this.list);
},
_register: function (key, value, data, list) {
if (key && data && value !== undefined) {
data[key] = value;
list.push(value);
}
},
_unregister: function (key, data, list) {
if (key && data) {
if (key in data) {
var value = data[key];
delete data[key];
this.arrayDelete(list, value);
}
}
}
});
Polymer.IronMetaQuery = Polymer({
is: 'iron-meta-query',
properties: {
type: {
type: String,
value: 'default',
observer: '_typeChanged'
},
key: {
type: String,
observer: '_keyChanged'
},
value: {
type: Object,
notify: true,
readOnly: true
},
list: {
type: Array,
notify: true
}
},
factoryImpl: function (config) {
if (config) {
for (var n in config) {
switch (n) {
case 'type':
case 'key':
this[n] = config[n];
break;
}
}
}
},
created: function () {
this._metaDatas = metaDatas;
this._metaArrays = metaArrays;
},
_keyChanged: function (key) {
this._setValue(this._metaData && this._metaData[key]);
},
_typeChanged: function (type) {
this._metaData = metaDatas[type];
this.list = metaArrays[type];
if (this.key) {
this._keyChanged(this.key);
}
},
byKey: function (key) {
return this._metaData && this._metaData[key];
}
});
}());
;Polymer({
is: 'iron-iconset-svg',
properties: {
name: {
type: String,
observer: '_nameChanged'
},
size: {
type: Number,
value: 24
}
},
getIconNames: function () {
this._icons = this._createIconMap();
return Object.keys(this._icons).map(function (n) {
return this.name + ':' + n;
}, this);
},
applyIcon: function (element, iconName) {
element = element.root || element;
this.removeIcon(element);
var svg = this._cloneIcon(iconName);
if (svg) {
var pde = Polymer.dom(element);
pde.insertBefore(svg, pde.childNodes[0]);
return element._svgIcon = svg;
}
return null;
},
removeIcon: function (element) {
if (element._svgIcon) {
Polymer.dom(element).removeChild(element._svgIcon);
element._svgIcon = null;
}
},
_nameChanged: function () {
new Polymer.IronMeta({
type: 'iconset',
key: this.name,
value: this
});
},
_createIconMap: function () {
var icons = Object.create(null);
Polymer.dom(this).querySelectorAll('[id]').forEach(function (icon) {
icons[icon.id] = icon;
});
return icons;
},
_cloneIcon: function (id) {
this._icons = this._icons || this._createIconMap();
return this._prepareSvgClone(this._icons[id], this.size);
},
_prepareSvgClone: function (sourceSvg, size) {
if (sourceSvg) {
var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('viewBox', [
'0',
'0',
size,
size
].join(' '));
svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
svg.style.cssText = 'pointer-events: none; display: block; width: 100%; height: 100%;';
svg.appendChild(sourceSvg.cloneNode(true)).removeAttribute('id');
return svg;
}
return null;
}
});
;Polymer.IronResizableBehavior = {
properties: {
_parentResizable: {
type: Object,
observer: '_parentResizableChanged'
},
_notifyingDescendant: {
type: Boolean,
value: false
}
},
listeners: { 'iron-request-resize-notifications': '_onIronRequestResizeNotifications' },
created: function () {
this._interestedResizables = [];
this._boundNotifyResize = this.notifyResize.bind(this);
},
attached: function () {
this.fire('iron-request-resize-notifications', null, {
node: this,
bubbles: true,
cancelable: true
});
if (!this._parentResizable) {
window.addEventListener('resize', this._boundNotifyResize);
this.notifyResize();
}
},
detached: function () {
if (this._parentResizable) {
this._parentResizable.stopResizeNotificationsFor(this);
} else {
window.removeEventListener('resize', this._boundNotifyResize);
}
this._parentResizable = null;
},
notifyResize: function () {
if (!this.isAttached) {
return;
}
this._interestedResizables.forEach(function (resizable) {
if (this.resizerShouldNotify(resizable)) {
this._notifyDescendant(resizable);
}
}, this);
this._fireResize();
},
assignParentResizable: function (parentResizable) {
this._parentResizable = parentResizable;
},
stopResizeNotificationsFor: function (target) {
var index = this._interestedResizables.indexOf(target);
if (index > -1) {
this._interestedResizables.splice(index, 1);
this.unlisten(target, 'iron-resize', '_onDescendantIronResize');
}
},
resizerShouldNotify: function (element) {
return true;
},
_onDescendantIronResize: function (event) {
if (this._notifyingDescendant) {
event.stopPropagation();
return;
}
if (!Polymer.Settings.useShadow) {
this._fireResize();
}
},
_fireResize: function () {
this.fire('iron-resize', null, {
node: this,
bubbles: false
});
},
_onIronRequestResizeNotifications: function (event) {
var target = event.path ? event.path[0] : event.target;
if (target === this) {
return;
}
if (this._interestedResizables.indexOf(target) === -1) {
this._interestedResizables.push(target);
this.listen(target, 'iron-resize', '_onDescendantIronResize');
}
target.assignParentResizable(this);
this._notifyDescendant(target);
event.stopPropagation();
},
_parentResizableChanged: function (parentResizable) {
if (parentResizable) {
window.removeEventListener('resize', this._boundNotifyResize);
}
},
_notifyDescendant: function (descendant) {
if (!this.isAttached) {
return;
}
this._notifyingDescendant = true;
descendant.notifyResize();
this._notifyingDescendant = false;
}
};
;Polymer.IronControlState = {
properties: {
focused: {
type: Boolean,
value: false,
notify: true,
readOnly: true,
reflectToAttribute: true
},
disabled: {
type: Boolean,
value: false,
notify: true,
observer: '_disabledChanged',
reflectToAttribute: true
},
_oldTabIndex: { type: Number },
_boundFocusBlurHandler: {
type: Function,
value: function () {
return this._focusBlurHandler.bind(this);
}
}
},
observers: ['_changedControlState(focused, disabled)'],
ready: function () {
this.addEventListener('focus', this._boundFocusBlurHandler, true);
this.addEventListener('blur', this._boundFocusBlurHandler, true);
},
_focusBlurHandler: function (event) {
if (event.target === this) {
var focused = event.type === 'focus';
this._setFocused(focused);
} else if (!this.shadowRoot) {
this.fire(event.type, { sourceEvent: event }, {
node: this,
bubbles: event.bubbles,
cancelable: event.cancelable
});
}
},
_disabledChanged: function (disabled, old) {
this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
this.style.pointerEvents = disabled ? 'none' : '';
if (disabled) {
this._oldTabIndex = this.tabIndex;
this.focused = false;
this.tabIndex = -1;
} else if (this._oldTabIndex !== undefined) {
this.tabIndex = this._oldTabIndex;
}
},
_changedControlState: function () {
if (this._controlStateChanged) {
this._controlStateChanged();
}
}
};
;Polymer.IronButtonStateImpl = {
properties: {
pressed: {
type: Boolean,
readOnly: true,
value: false,
reflectToAttribute: true,
observer: '_pressedChanged'
},
toggles: {
type: Boolean,
value: false,
reflectToAttribute: true
},
active: {
type: Boolean,
value: false,
notify: true,
reflectToAttribute: true
},
pointerDown: {
type: Boolean,
readOnly: true,
value: false
},
receivedFocusFromKeyboard: {
type: Boolean,
readOnly: true
},
ariaActiveAttribute: {
type: String,
value: 'aria-pressed',
observer: '_ariaActiveAttributeChanged'
}
},
listeners: {
down: '_downHandler',
up: '_upHandler',
tap: '_tapHandler'
},
observers: [
'_detectKeyboardFocus(focused)',
'_activeChanged(active, ariaActiveAttribute)'
],
keyBindings: {
'enter:keydown': '_asyncClick',
'space:keydown': '_spaceKeyDownHandler',
'space:keyup': '_spaceKeyUpHandler'
},
_mouseEventRe: /^mouse/,
_tapHandler: function () {
if (this.toggles) {
this._userActivate(!this.active);
} else {
this.active = false;
}
},
_detectKeyboardFocus: function (focused) {
this._setReceivedFocusFromKeyboard(!this.pointerDown && focused);
},
_userActivate: function (active) {
if (this.active !== active) {
this.active = active;
this.fire('change');
}
},
_eventSourceIsPrimaryInput: function (event) {
event = event.detail.sourceEvent || event;
if (!this._mouseEventRe.test(event.type)) {
return true;
}
if ('buttons' in event) {
return event.buttons === 1;
}
if (typeof event.which === 'number') {
return event.which < 2;
}
return event.button < 1;
},
_downHandler: function (event) {
if (!this._eventSourceIsPrimaryInput(event)) {
return;
}
this._setPointerDown(true);
this._setPressed(true);
this._setReceivedFocusFromKeyboard(false);
},
_upHandler: function () {
this._setPointerDown(false);
this._setPressed(false);
},
_spaceKeyDownHandler: function (event) {
var keyboardEvent = event.detail.keyboardEvent;
keyboardEvent.preventDefault();
keyboardEvent.stopImmediatePropagation();
this._setPressed(true);
},
_spaceKeyUpHandler: function () {
if (this.pressed) {
this._asyncClick();
}
this._setPressed(false);
},
_asyncClick: function () {
this.async(function () {
this.click();
}, 1);
},
_pressedChanged: function (pressed) {
this._changedButtonState();
},
_ariaActiveAttributeChanged: function (value, oldValue) {
if (oldValue && oldValue != value && this.hasAttribute(oldValue)) {
this.removeAttribute(oldValue);
}
},
_activeChanged: function (active, ariaActiveAttribute) {
if (this.toggles) {
this.setAttribute(this.ariaActiveAttribute, active ? 'true' : 'false');
} else {
this.removeAttribute(this.ariaActiveAttribute);
}
this._changedButtonState();
},
_controlStateChanged: function () {
if (this.disabled) {
this._setPressed(false);
} else {
this._changedButtonState();
}
},
_changedButtonState: function () {
if (this._buttonStateChanged) {
this._buttonStateChanged();
}
}
};
Polymer.IronButtonState = [
Polymer.IronA11yKeysBehavior,
Polymer.IronButtonStateImpl
];
;Polymer.PaperButtonBehaviorImpl = {
properties: { _elevation: { type: Number } },
observers: ['_calculateElevation(focused, disabled, active, pressed, receivedFocusFromKeyboard)'],
hostAttributes: {
role: 'button',
tabindex: '0'
},
_calculateElevation: function () {
var e = 1;
if (this.disabled) {
e = 0;
} else if (this.active || this.pressed) {
e = 4;
} else if (this.receivedFocusFromKeyboard) {
e = 3;
}
this._elevation = e;
}
};
Polymer.PaperButtonBehavior = [
Polymer.IronButtonState,
Polymer.IronControlState,
Polymer.PaperButtonBehaviorImpl
];
;Polymer.PaperInkyFocusBehaviorImpl = {
observers: ['_focusedChanged(receivedFocusFromKeyboard)'],
_focusedChanged: function (receivedFocusFromKeyboard) {
if (!this.$.ink) {
return;
}
this.$.ink.holdDown = receivedFocusFromKeyboard;
}
};
Polymer.PaperInkyFocusBehavior = [
Polymer.IronButtonState,
Polymer.IronControlState,
Polymer.PaperInkyFocusBehaviorImpl
];
;Polymer.IronFitBehavior = {
properties: {
sizingTarget: {
type: Object,
value: function () {
return this;
}
},
fitInto: {
type: Object,
value: window
},
autoFitOnAttach: {
type: Boolean,
value: false
},
_fitInfo: { type: Object }
},
get _fitWidth() {
var fitWidth;
if (this.fitInto === window) {
fitWidth = this.fitInto.innerWidth;
} else {
fitWidth = this.fitInto.getBoundingClientRect().width;
}
return fitWidth;
},
get _fitHeight() {
var fitHeight;
if (this.fitInto === window) {
fitHeight = this.fitInto.innerHeight;
} else {
fitHeight = this.fitInto.getBoundingClientRect().height;
}
return fitHeight;
},
get _fitLeft() {
var fitLeft;
if (this.fitInto === window) {
fitLeft = 0;
} else {
fitLeft = this.fitInto.getBoundingClientRect().left;
}
return fitLeft;
},
get _fitTop() {
var fitTop;
if (this.fitInto === window) {
fitTop = 0;
} else {
fitTop = this.fitInto.getBoundingClientRect().top;
}
return fitTop;
},
attached: function () {
if (this.autoFitOnAttach) {
if (window.getComputedStyle(this).display === 'none') {
setTimeout(function () {
this.fit();
}.bind(this));
} else {
this.fit();
}
}
},
fit: function () {
this._discoverInfo();
this.constrain();
this.center();
},
_discoverInfo: function () {
if (this._fitInfo) {
return;
}
var target = window.getComputedStyle(this);
var sizer = window.getComputedStyle(this.sizingTarget);
this._fitInfo = {
inlineStyle: {
top: this.style.top || '',
left: this.style.left || ''
},
positionedBy: {
vertically: target.top !== 'auto' ? 'top' : target.bottom !== 'auto' ? 'bottom' : null,
horizontally: target.left !== 'auto' ? 'left' : target.right !== 'auto' ? 'right' : null,
css: target.position
},
sizedBy: {
height: sizer.maxHeight !== 'none',
width: sizer.maxWidth !== 'none'
},
margin: {
top: parseInt(target.marginTop, 10) || 0,
right: parseInt(target.marginRight, 10) || 0,
bottom: parseInt(target.marginBottom, 10) || 0,
left: parseInt(target.marginLeft, 10) || 0
}
};
},
resetFit: function () {
if (!this._fitInfo || !this._fitInfo.sizedBy.height) {
this.sizingTarget.style.maxHeight = '';
this.style.top = this._fitInfo ? this._fitInfo.inlineStyle.top : '';
}
if (!this._fitInfo || !this._fitInfo.sizedBy.width) {
this.sizingTarget.style.maxWidth = '';
this.style.left = this._fitInfo ? this._fitInfo.inlineStyle.left : '';
}
if (this._fitInfo) {
this.style.position = this._fitInfo.positionedBy.css;
}
this._fitInfo = null;
},
refit: function () {
this.resetFit();
this.fit();
},
constrain: function () {
var info = this._fitInfo;
if (!this._fitInfo.positionedBy.vertically) {
this.style.top = '0px';
}
if (!this._fitInfo.positionedBy.horizontally) {
this.style.left = '0px';
}
this.sizingTarget.style.boxSizing = 'border-box';
var rect = this.getBoundingClientRect();
if (!info.sizedBy.height) {
this._sizeDimension(rect, info.positionedBy.vertically, 'top', 'bottom', 'Height');
}
if (!info.sizedBy.width) {
this._sizeDimension(rect, info.positionedBy.horizontally, 'left', 'right', 'Width');
}
},
_sizeDimension: function (rect, positionedBy, start, end, extent) {
var info = this._fitInfo;
var max = extent === 'Width' ? this._fitWidth : this._fitHeight;
var flip = positionedBy === end;
var offset = flip ? max - rect[end] : rect[start];
var margin = info.margin[flip ? start : end];
var offsetExtent = 'offset' + extent;
var sizingOffset = this[offsetExtent] - this.sizingTarget[offsetExtent];
this.sizingTarget.style['max' + extent] = max - margin - offset - sizingOffset + 'px';
},
center: function () {
if (!this._fitInfo.positionedBy.vertically || !this._fitInfo.positionedBy.horizontally) {
this.style.position = 'fixed';
}
if (!this._fitInfo.positionedBy.vertically) {
var top = (this._fitHeight - this.offsetHeight) / 2 + this._fitTop;
top -= this._fitInfo.margin.top;
this.style.top = top + 'px';
}
if (!this._fitInfo.positionedBy.horizontally) {
var left = (this._fitWidth - this.offsetWidth) / 2 + this._fitLeft;
left -= this._fitInfo.margin.left;
this.style.left = left + 'px';
}
}
};
;Polymer.IronOverlayManager = function () {
var overlays = [];
var DEFAULT_Z = 10;
var backdrops = [];
function addOverlay(overlay) {
var z0 = currentOverlayZ();
overlays.push(overlay);
var z1 = currentOverlayZ();
if (z1 <= z0) {
applyOverlayZ(overlay, z0);
}
}
function removeOverlay(overlay) {
var i = overlays.indexOf(overlay);
if (i >= 0) {
overlays.splice(i, 1);
setZ(overlay, '');
}
}
function applyOverlayZ(overlay, aboveZ) {
setZ(overlay, aboveZ + 2);
}
function setZ(element, z) {
element.style.zIndex = z;
}
function currentOverlay() {
var i = overlays.length - 1;
while (overlays[i] && !overlays[i].opened) {
--i;
}
return overlays[i];
}
function currentOverlayZ() {
var z;
var current = currentOverlay();
if (current) {
var z1 = window.getComputedStyle(current).zIndex;
if (!isNaN(z1)) {
z = Number(z1);
}
}
return z || DEFAULT_Z;
}
function focusOverlay() {
var current = currentOverlay();
if (current && !current.transitioning) {
current._applyFocus();
}
}
function trackBackdrop(element) {
if (element.opened) {
backdrops.push(element);
} else {
var index = backdrops.indexOf(element);
if (index >= 0) {
backdrops.splice(index, 1);
}
}
}
function getBackdrops() {
return backdrops;
}
return {
addOverlay: addOverlay,
removeOverlay: removeOverlay,
currentOverlay: currentOverlay,
currentOverlayZ: currentOverlayZ,
focusOverlay: focusOverlay,
trackBackdrop: trackBackdrop,
getBackdrops: getBackdrops
};
}();
;Polymer.IronOverlayBehaviorImpl = {
properties: {
opened: {
observer: '_openedChanged',
type: Boolean,
value: false,
notify: true
},
canceled: {
observer: '_canceledChanged',
readOnly: true,
type: Boolean,
value: false
},
withBackdrop: {
type: Boolean,
value: false
},
noAutoFocus: {
type: Boolean,
value: false
},
noCancelOnEscKey: {
type: Boolean,
value: false
},
noCancelOnOutsideClick: {
type: Boolean,
value: false
},
closingReason: { type: Object },
_manager: {
type: Object,
value: Polymer.IronOverlayManager
},
_boundOnCaptureClick: {
type: Function,
value: function () {
return this._onCaptureClick.bind(this);
}
},
_boundOnCaptureKeydown: {
type: Function,
value: function () {
return this._onCaptureKeydown.bind(this);
}
}
},
listeners: {
'click': '_onClick',
'iron-resize': '_onIronResize'
},
get backdropElement() {
return this._backdrop;
},
get _focusNode() {
return Polymer.dom(this).querySelector('[autofocus]') || this;
},
registered: function () {
this._backdrop = document.createElement('iron-overlay-backdrop');
},
ready: function () {
this._ensureSetup();
if (this._callOpenedWhenReady) {
this._openedChanged();
}
},
detached: function () {
this.opened = false;
this._completeBackdrop();
this._manager.removeOverlay(this);
},
toggle: function () {
this.opened = !this.opened;
},
open: function () {
this.opened = true;
this.closingReason = { canceled: false };
},
close: function () {
this.opened = false;
this._setCanceled(false);
},
cancel: function () {
this.opened = false, this._setCanceled(true);
},
_ensureSetup: function () {
if (this._overlaySetup) {
return;
}
this._overlaySetup = true;
this.style.outline = 'none';
this.style.display = 'none';
},
_openedChanged: function () {
if (this.opened) {
this.removeAttribute('aria-hidden');
} else {
this.setAttribute('aria-hidden', 'true');
}
if (!this._overlaySetup) {
this._callOpenedWhenReady = this.opened;
return;
}
if (this._openChangedAsync) {
this.cancelAsync(this._openChangedAsync);
}
this._toggleListeners();
if (this.opened) {
this._prepareRenderOpened();
}
this._openChangedAsync = this.async(function () {
this.style.display = '';
this.offsetWidth;
if (this.opened) {
this._renderOpened();
} else {
this._renderClosed();
}
this._openChangedAsync = null;
});
},
_canceledChanged: function () {
this.closingReason = this.closingReason || {};
this.closingReason.canceled = this.canceled;
},
_toggleListener: function (enable, node, event, boundListener, capture) {
if (enable) {
node.addEventListener(event, boundListener, capture);
} else {
node.removeEventListener(event, boundListener, capture);
}
},
_toggleListeners: function () {
if (this._toggleListenersAsync) {
this.cancelAsync(this._toggleListenersAsync);
}
this._toggleListenersAsync = this.async(function () {
this._toggleListener(this.opened, document, 'click', this._boundOnCaptureClick, true);
this._toggleListener(this.opened, document, 'keydown', this._boundOnCaptureKeydown, true);
this._toggleListenersAsync = null;
});
},
_prepareRenderOpened: function () {
this._manager.addOverlay(this);
if (this.withBackdrop) {
this.backdropElement.prepare();
this._manager.trackBackdrop(this);
}
this._preparePositioning();
this.fit();
this._finishPositioning();
},
_renderOpened: function () {
if (this.withBackdrop) {
this.backdropElement.open();
}
this._finishRenderOpened();
},
_renderClosed: function () {
if (this.withBackdrop) {
this.backdropElement.close();
}
this._finishRenderClosed();
},
_onTransitionend: function (event) {
if (event && event.target !== this) {
return;
}
if (this.opened) {
this._finishRenderOpened();
} else {
this._finishRenderClosed();
}
},
_finishRenderOpened: function () {
if (!this.noAutoFocus) {
this._focusNode.focus();
}
this.fire('iron-overlay-opened');
this._squelchNextResize = true;
this.async(this.notifyResize);
},
_finishRenderClosed: function () {
this.resetFit();
this.style.display = 'none';
this._completeBackdrop();
this._manager.removeOverlay(this);
this._focusNode.blur();
this._manager.focusOverlay();
this.fire('iron-overlay-closed', this.closingReason);
this._squelchNextResize = true;
this.async(this.notifyResize);
},
_completeBackdrop: function () {
if (this.withBackdrop) {
this._manager.trackBackdrop(this);
this.backdropElement.complete();
}
},
_preparePositioning: function () {
this.style.transition = this.style.webkitTransition = 'none';
this.style.transform = this.style.webkitTransform = 'none';
this.style.display = '';
},
_finishPositioning: function () {
this.style.display = 'none';
this.style.transform = this.style.webkitTransform = '';
this.offsetWidth;
this.style.transition = this.style.webkitTransition = '';
},
_applyFocus: function () {
if (this.opened) {
if (!this.noAutoFocus) {
this._focusNode.focus();
}
} else {
this._focusNode.blur();
this._manager.focusOverlay();
}
},
_onCaptureClick: function (event) {
if (!this.noCancelOnOutsideClick && this._manager.currentOverlay() == this) {
this._cancelJob = this.async(function () {
this.cancel();
}, 10);
}
},
_onClick: function (event) {
if (this._cancelJob) {
this.cancelAsync(this._cancelJob);
this._cancelJob = null;
}
},
_onCaptureKeydown: function (event) {
var ESC = 27;
if (!this.noCancelOnEscKey && event.keyCode === ESC) {
this.cancel();
event.stopPropagation();
}
},
_onIronResize: function () {
if (this._squelchNextResize) {
this._squelchNextResize = false;
return;
}
if (this.opened) {
this.refit();
}
}
};
Polymer.IronOverlayBehavior = [
Polymer.IronFitBehavior,
Polymer.IronResizableBehavior,
Polymer.IronOverlayBehaviorImpl
];
;Polymer.NeonAnimationBehavior = {
properties: {
animationTiming: {
type: Object,
value: function () {
return {
duration: 500,
easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
fill: 'both'
};
}
}
},
registered: function () {
new Polymer.IronMeta({
type: 'animation',
key: this.is,
value: this.constructor
});
},
timingFromConfig: function (config) {
if (config.timing) {
for (var property in config.timing) {
this.animationTiming[property] = config.timing[property];
}
}
return this.animationTiming;
},
setPrefixedProperty: function (node, property, value) {
var map = {
'transform': ['webkitTransform'],
'transformOrigin': [
'mozTransformOrigin',
'webkitTransformOrigin'
]
};
var prefixes = map[property];
for (var prefix, index = 0; prefix = prefixes[index]; index++) {
node.style[prefix] = value;
}
node.style[property] = value;
},
complete: function () {
}
};
;!function (a, b) {
b['true'] = a;
var c = {}, d = {}, e = {}, f = null;
!function (a) {
function b(a) {
if ('number' == typeof a)
return a;
var b = {};
for (var c in a)
b[c] = a[c];
return b;
}
function c() {
this._delay = 0, this._endDelay = 0, this._fill = 'none', this._iterationStart = 0, this._iterations = 1, this._duration = 0, this._playbackRate = 1, this._direction = 'normal', this._easing = 'linear';
}
function d(b, d) {
var e = new c();
return d && (e.fill = 'both', e.duration = 'auto'), 'number' != typeof b || isNaN(b) ? void 0 !== b && Object.getOwnPropertyNames(b).forEach(function (c) {
if ('auto' != b[c]) {
if (('number' == typeof e[c] || 'duration' == c) && ('number' != typeof b[c] || isNaN(b[c])))
return;
if ('fill' == c && -1 == s.indexOf(b[c]))
return;
if ('direction' == c && -1 == t.indexOf(b[c]))
return;
if ('playbackRate' == c && 1 !== b[c] && a.isDeprecated('AnimationEffectTiming.playbackRate', '2014-11-28', 'Use Animation.playbackRate instead.'))
return;
e[c] = b[c];
}
}) : e.duration = b, e;
}
function e(a) {
return 'number' == typeof a && (a = isNaN(a) ? { duration: 0 } : { duration: a }), a;
}
function f(b, c) {
b = a.numericTimingToObject(b);
var e = d(b, c);
return e._easing = i(e.easing), e;
}
function g(a, b, c, d) {
return 0 > a || a > 1 || 0 > c || c > 1 ? B : function (e) {
function f(a, b, c) {
return 3 * a * (1 - c) * (1 - c) * c + 3 * b * (1 - c) * c * c + c * c * c;
}
if (0 == e || 1 == e)
return e;
for (var g = 0, h = 1;;) {
var i = (g + h) / 2, j = f(a, c, i);
if (Math.abs(e - j) < 0.001)
return f(b, d, i);
e > j ? g = i : h = i;
}
};
}
function h(a, b) {
return function (c) {
if (c >= 1)
return 1;
var d = 1 / a;
return c += b * d, c - c % d;
};
}
function i(a) {
var b = z.exec(a);
if (b)
return g.apply(this, b.slice(1).map(Number));
var c = A.exec(a);
if (c)
return h(Number(c[1]), {
start: u,
middle: v,
end: w
}[c[2]]);
var d = x[a];
return d ? d : B;
}
function j(a) {
return Math.abs(k(a) / a.playbackRate);
}
function k(a) {
return a.duration * a.iterations;
}
function l(a, b, c) {
return null == b ? C : b < c.delay ? D : b >= c.delay + a ? E : F;
}
function m(a, b, c, d, e) {
switch (d) {
case D:
return 'backwards' == b || 'both' == b ? 0 : null;
case F:
return c - e;
case E:
return 'forwards' == b || 'both' == b ? a : null;
case C:
return null;
}
}
function n(a, b, c, d) {
return (d.playbackRate < 0 ? b - a : b) * d.playbackRate + c;
}
function o(a, b, c, d, e) {
return 1 / 0 === c || c === -1 / 0 || c - d == b && e.iterations && (e.iterations + e.iterationStart) % 1 == 0 ? a : c % a;
}
function p(a, b, c, d) {
return 0 === c ? 0 : b == a ? d.iterationStart + d.iterations - 1 : Math.floor(c / a);
}
function q(a, b, c, d) {
var e = a % 2 >= 1, f = 'normal' == d.direction || d.direction == (e ? 'alternate-reverse' : 'alternate'), g = f ? c : b - c, h = g / b;
return b * d.easing(h);
}
function r(a, b, c) {
var d = l(a, b, c), e = m(a, c.fill, b, d, c.delay);
if (null === e)
return null;
if (0 === a)
return d === D ? 0 : 1;
var f = c.iterationStart * c.duration, g = n(a, e, f, c), h = o(c.duration, k(c), g, f, c), i = p(c.duration, h, g, c);
return q(i, c.duration, h, c) / c.duration;
}
var s = 'backwards|forwards|both|none'.split('|'), t = 'reverse|alternate|alternate-reverse'.split('|');
c.prototype = {
_setMember: function (b, c) {
this['_' + b] = c, this._effect && (this._effect._timingInput[b] = c, this._effect._timing = a.normalizeTimingInput(a.normalizeTimingInput(this._effect._timingInput)), this._effect.activeDuration = a.calculateActiveDuration(this._effect._timing), this._effect._animation && this._effect._animation._rebuildUnderlyingAnimation());
},
get playbackRate() {
return this._playbackRate;
},
set delay(a) {
this._setMember('delay', a);
},
get delay() {
return this._delay;
},
set endDelay(a) {
this._setMember('endDelay', a);
},
get endDelay() {
return this._endDelay;
},
set fill(a) {
this._setMember('fill', a);
},
get fill() {
return this._fill;
},
set iterationStart(a) {
this._setMember('iterationStart', a);
},
get iterationStart() {
return this._iterationStart;
},
set duration(a) {
this._setMember('duration', a);
},
get duration() {
return this._duration;
},
set direction(a) {
this._setMember('direction', a);
},
get direction() {
return this._direction;
},
set easing(a) {
this._setMember('easing', a);
},
get easing() {
return this._easing;
},
set iterations(a) {
this._setMember('iterations', a);
},
get iterations() {
return this._iterations;
}
};
var u = 1, v = 0.5, w = 0, x = {
ease: g(0.25, 0.1, 0.25, 1),
'ease-in': g(0.42, 0, 1, 1),
'ease-out': g(0, 0, 0.58, 1),
'ease-in-out': g(0.42, 0, 0.58, 1),
'step-start': h(1, u),
'step-middle': h(1, v),
'step-end': h(1, w)
}, y = '\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*', z = new RegExp('cubic-bezier\\(' + y + ',' + y + ',' + y + ',' + y + '\\)'), A = /steps\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/, B = function (a) {
return a;
}, C = 0, D = 1, E = 2, F = 3;
a.cloneTimingInput = b, a.makeTiming = d, a.numericTimingToObject = e, a.normalizeTimingInput = f, a.calculateActiveDuration = j, a.calculateTimeFraction = r, a.calculatePhase = l, a.toTimingFunction = i;
}(c, f), function (a) {
function b(a, b) {
return a in h ? h[a][b] || b : b;
}
function c(a, c, d) {
var g = e[a];
if (g) {
f.style[a] = c;
for (var h in g) {
var i = g[h], j = f.style[i];
d[i] = b(i, j);
}
} else
d[a] = b(a, c);
}
function d(b) {
function d() {
var a = e.length;
null == e[a - 1].offset && (e[a - 1].offset = 1), a > 1 && null == e[0].offset && (e[0].offset = 0);
for (var b = 0, c = e[0].offset, d = 1; a > d; d++) {
var f = e[d].offset;
if (null != f) {
for (var g = 1; d - b > g; g++)
e[b + g].offset = c + (f - c) * g / (d - b);
b = d, c = f;
}
}
}
if (!Array.isArray(b) && null !== b)
throw new TypeError('Keyframes must be null or an array of keyframes');
if (null == b)
return [];
for (var e = b.map(function (b) {
var d = {};
for (var e in b) {
var f = b[e];
if ('offset' == e) {
if (null != f && (f = Number(f), !isFinite(f)))
throw new TypeError('keyframe offsets must be numbers.');
} else {
if ('composite' == e)
throw {
type: DOMException.NOT_SUPPORTED_ERR,
name: 'NotSupportedError',
message: 'add compositing is not supported'
};
f = 'easing' == e ? a.toTimingFunction(f) : '' + f;
}
c(e, f, d);
}
return void 0 == d.offset && (d.offset = null), void 0 == d.easing && (d.easing = a.toTimingFunction('linear')), d;
}), f = !0, g = -1 / 0, h = 0; h < e.length; h++) {
var i = e[h].offset;
if (null != i) {
if (g > i)
throw {
code: DOMException.INVALID_MODIFICATION_ERR,
name: 'InvalidModificationError',
message: 'Keyframes are not loosely sorted by offset. Sort or specify offsets.'
};
g = i;
} else
f = !1;
}
return e = e.filter(function (a) {
return a.offset >= 0 && a.offset <= 1;
}), f || d(), e;
}
var e = {
background: [
'backgroundImage',
'backgroundPosition',
'backgroundSize',
'backgroundRepeat',
'backgroundAttachment',
'backgroundOrigin',
'backgroundClip',
'backgroundColor'
],
border: [
'borderTopColor',
'borderTopStyle',
'borderTopWidth',
'borderRightColor',
'borderRightStyle',
'borderRightWidth',
'borderBottomColor',
'borderBottomStyle',
'borderBottomWidth',
'borderLeftColor',
'borderLeftStyle',
'borderLeftWidth'
],
borderBottom: [
'borderBottomWidth',
'borderBottomStyle',
'borderBottomColor'
],
borderColor: [
'borderTopColor',
'borderRightColor',
'borderBottomColor',
'borderLeftColor'
],
borderLeft: [
'borderLeftWidth',
'borderLeftStyle',
'borderLeftColor'
],
borderRadius: [
'borderTopLeftRadius',
'borderTopRightRadius',
'borderBottomRightRadius',
'borderBottomLeftRadius'
],
borderRight: [
'borderRightWidth',
'borderRightStyle',
'borderRightColor'
],
borderTop: [
'borderTopWidth',
'borderTopStyle',
'borderTopColor'
],
borderWidth: [
'borderTopWidth',
'borderRightWidth',
'borderBottomWidth',
'borderLeftWidth'
],
flex: [
'flexGrow',
'flexShrink',
'flexBasis'
],
font: [
'fontFamily',
'fontSize',
'fontStyle',
'fontVariant',
'fontWeight',
'lineHeight'
],
margin: [
'marginTop',
'marginRight',
'marginBottom',
'marginLeft'
],
outline: [
'outlineColor',
'outlineStyle',
'outlineWidth'
],
padding: [
'paddingTop',
'paddingRight',
'paddingBottom',
'paddingLeft'
]
}, f = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'), g = {
thin: '1px',
medium: '3px',
thick: '5px'
}, h = {
borderBottomWidth: g,
borderLeftWidth: g,
borderRightWidth: g,
borderTopWidth: g,
fontSize: {
'xx-small': '60%',
'x-small': '75%',
small: '89%',
medium: '100%',
large: '120%',
'x-large': '150%',
'xx-large': '200%'
},
fontWeight: {
normal: '400',
bold: '700'
},
outlineWidth: g,
textShadow: { none: '0px 0px 0px transparent' },
boxShadow: { none: '0px 0px 0px 0px transparent' }
};
a.normalizeKeyframes = d;
}(c, f), function (a) {
var b = {};
a.isDeprecated = function (a, c, d, e) {
var f = e ? 'are' : 'is', g = new Date(), h = new Date(c);
return h.setMonth(h.getMonth() + 3), h > g ? (a in b || console.warn('Web Animations: ' + a + ' ' + f + ' deprecated and will stop working on ' + h.toDateString() + '. ' + d), b[a] = !0, !1) : !0;
}, a.deprecated = function (b, c, d, e) {
var f = e ? 'are' : 'is';
if (a.isDeprecated(b, c, d, e))
throw new Error(b + ' ' + f + ' no longer supported. ' + d);
};
}(c), function () {
if (document.documentElement.animate) {
var a = document.documentElement.animate([], 0), b = !0;
if (a && (b = !1, 'play|currentTime|pause|reverse|playbackRate|cancel|finish|startTime|playState'.split('|').forEach(function (c) {
void 0 === a[c] && (b = !0);
})), !b)
return;
}
!function (a, b) {
function c(a) {
for (var b = {}, c = 0; c < a.length; c++)
for (var d in a[c])
if ('offset' != d && 'easing' != d && 'composite' != d) {
var e = {
offset: a[c].offset,
easing: a[c].easing,
value: a[c][d]
};
b[d] = b[d] || [], b[d].push(e);
}
for (var f in b) {
var g = b[f];
if (0 != g[0].offset || 1 != g[g.length - 1].offset)
throw {
type: DOMException.NOT_SUPPORTED_ERR,
name: 'NotSupportedError',
message: 'Partial keyframes are not supported'
};
}
return b;
}
function d(a) {
var c = [];
for (var d in a)
for (var e = a[d], f = 0; f < e.length - 1; f++) {
var g = e[f].offset, h = e[f + 1].offset, i = e[f].value, j = e[f + 1].value;
g == h && (1 == h ? i = j : j = i), c.push({
startTime: g,
endTime: h,
easing: e[f].easing,
property: d,
interpolation: b.propertyInterpolation(d, i, j)
});
}
return c.sort(function (a, b) {
return a.startTime - b.startTime;
}), c;
}
b.convertEffectInput = function (e) {
var f = a.normalizeKeyframes(e), g = c(f), h = d(g);
return function (a, c) {
if (null != c)
h.filter(function (a) {
return 0 >= c && 0 == a.startTime || c >= 1 && 1 == a.endTime || c >= a.startTime && c <= a.endTime;
}).forEach(function (d) {
var e = c - d.startTime, f = d.endTime - d.startTime, g = 0 == f ? 0 : d.easing(e / f);
b.apply(a, d.property, d.interpolation(g));
});
else
for (var d in g)
'offset' != d && 'easing' != d && 'composite' != d && b.clear(a, d);
};
};
}(c, d, f), function (a) {
function b(a, b, c) {
e[c] = e[c] || [], e[c].push([
a,
b
]);
}
function c(a, c, d) {
for (var e = 0; e < d.length; e++) {
var f = d[e];
b(a, c, f), /-/.test(f) && b(a, c, f.replace(/-(.)/g, function (a, b) {
return b.toUpperCase();
}));
}
}
function d(b, c, d) {
if ('initial' == c || 'initial' == d) {
var g = b.replace(/-(.)/g, function (a, b) {
return b.toUpperCase();
});
'initial' == c && (c = f[g]), 'initial' == d && (d = f[g]);
}
for (var h = c == d ? [] : e[b], i = 0; h && i < h.length; i++) {
var j = h[i][0](c), k = h[i][0](d);
if (void 0 !== j && void 0 !== k) {
var l = h[i][1](j, k);
if (l) {
var m = a.Interpolation.apply(null, l);
return function (a) {
return 0 == a ? c : 1 == a ? d : m(a);
};
}
}
}
return a.Interpolation(!1, !0, function (a) {
return a ? d : c;
});
}
var e = {};
a.addPropertiesHandler = c;
var f = {
backgroundColor: 'transparent',
backgroundPosition: '0% 0%',
borderBottomColor: 'currentColor',
borderBottomLeftRadius: '0px',
borderBottomRightRadius: '0px',
borderBottomWidth: '3px',
borderLeftColor: 'currentColor',
borderLeftWidth: '3px',
borderRightColor: 'currentColor',
borderRightWidth: '3px',
borderSpacing: '2px',
borderTopColor: 'currentColor',
borderTopLeftRadius: '0px',
borderTopRightRadius: '0px',
borderTopWidth: '3px',
bottom: 'auto',
clip: 'rect(0px, 0px, 0px, 0px)',
color: 'black',
fontSize: '100%',
fontWeight: '400',
height: 'auto',
left: 'auto',
letterSpacing: 'normal',
lineHeight: '120%',
marginBottom: '0px',
marginLeft: '0px',
marginRight: '0px',
marginTop: '0px',
maxHeight: 'none',
maxWidth: 'none',
minHeight: '0px',
minWidth: '0px',
opacity: '1.0',
outlineColor: 'invert',
outlineOffset: '0px',
outlineWidth: '3px',
paddingBottom: '0px',
paddingLeft: '0px',
paddingRight: '0px',
paddingTop: '0px',
right: 'auto',
textIndent: '0px',
textShadow: '0px 0px 0px transparent',
top: 'auto',
transform: '',
verticalAlign: '0px',
visibility: 'visible',
width: 'auto',
wordSpacing: 'normal',
zIndex: 'auto'
};
a.propertyInterpolation = d;
}(d, f), function (a, b) {
function c(b) {
var c = a.calculateActiveDuration(b), d = function (d) {
return a.calculateTimeFraction(c, d, b);
};
return d._totalDuration = b.delay + c + b.endDelay, d._isCurrent = function (d) {
var e = a.calculatePhase(c, d, b);
return e === PhaseActive || e === PhaseBefore;
}, d;
}
b.KeyframeEffect = function (d, e, f) {
var g, h = c(a.normalizeTimingInput(f)), i = b.convertEffectInput(e), j = function () {
i(d, g);
};
return j._update = function (a) {
return g = h(a), null !== g;
}, j._clear = function () {
i(d, null);
}, j._hasSameTarget = function (a) {
return d === a;
}, j._isCurrent = h._isCurrent, j._totalDuration = h._totalDuration, j;
}, b.NullEffect = function (a) {
var b = function () {
a && (a(), a = null);
};
return b._update = function () {
return null;
}, b._totalDuration = 0, b._isCurrent = function () {
return !1;
}, b._hasSameTarget = function () {
return !1;
}, b;
};
}(c, d, f), function (a) {
a.apply = function (b, c, d) {
b.style[a.propertyName(c)] = d;
}, a.clear = function (b, c) {
b.style[a.propertyName(c)] = '';
};
}(d, f), function (a) {
window.Element.prototype.animate = function (b, c) {
return a.timeline._play(a.KeyframeEffect(this, b, c));
};
}(d), function (a) {
function b(a, c, d) {
if ('number' == typeof a && 'number' == typeof c)
return a * (1 - d) + c * d;
if ('boolean' == typeof a && 'boolean' == typeof c)
return 0.5 > d ? a : c;
if (a.length == c.length) {
for (var e = [], f = 0; f < a.length; f++)
e.push(b(a[f], c[f], d));
return e;
}
throw 'Mismatched interpolation arguments ' + a + ':' + c;
}
a.Interpolation = function (a, c, d) {
return function (e) {
return d(b(a, c, e));
};
};
}(d, f), function (a, b) {
a.sequenceNumber = 0;
var c = function (a, b, c) {
this.target = a, this.currentTime = b, this.timelineTime = c, this.type = 'finish', this.bubbles = !1, this.cancelable = !1, this.currentTarget = a, this.defaultPrevented = !1, this.eventPhase = Event.AT_TARGET, this.timeStamp = Date.now();
};
b.Animation = function (b) {
this._sequenceNumber = a.sequenceNumber++, this._currentTime = 0, this._startTime = null, this._paused = !1, this._playbackRate = 1, this._inTimeline = !0, this._finishedFlag = !1, this.onfinish = null, this._finishHandlers = [], this._effect = b, this._inEffect = this._effect._update(0), this._idle = !0, this._currentTimePending = !1;
}, b.Animation.prototype = {
_ensureAlive: function () {
this._inEffect = this._effect._update(this.playbackRate < 0 && 0 === this.currentTime ? -1 : this.currentTime), this._inTimeline || !this._inEffect && this._finishedFlag || (this._inTimeline = !0, b.timeline._animations.push(this));
},
_tickCurrentTime: function (a, b) {
a != this._currentTime && (this._currentTime = a, this._isFinished && !b && (this._currentTime = this._playbackRate > 0 ? this._totalDuration : 0), this._ensureAlive());
},
get currentTime() {
return this._idle || this._currentTimePending ? null : this._currentTime;
},
set currentTime(a) {
a = +a, isNaN(a) || (b.restart(), this._paused || null == this._startTime || (this._startTime = this._timeline.currentTime - a / this._playbackRate), this._currentTimePending = !1, this._currentTime != a && (this._tickCurrentTime(a, !0), b.invalidateEffects()));
},
get startTime() {
return this._startTime;
},
set startTime(a) {
a = +a, isNaN(a) || this._paused || this._idle || (this._startTime = a, this._tickCurrentTime((this._timeline.currentTime - this._startTime) * this.playbackRate), b.invalidateEffects());
},
get playbackRate() {
return this._playbackRate;
},
set playbackRate(a) {
if (a != this._playbackRate) {
var b = this.currentTime;
this._playbackRate = a, this._startTime = null, 'paused' != this.playState && 'idle' != this.playState && this.play(), null != b && (this.currentTime = b);
}
},
get _isFinished() {
return !this._idle && (this._playbackRate > 0 && this._currentTime >= this._totalDuration || this._playbackRate < 0 && this._currentTime <= 0);
},
get _totalDuration() {
return this._effect._totalDuration;
},
get playState() {
return this._idle ? 'idle' : null == this._startTime && !this._paused && 0 != this.playbackRate || this._currentTimePending ? 'pending' : this._paused ? 'paused' : this._isFinished ? 'finished' : 'running';
},
play: function () {
this._paused = !1, (this._isFinished || this._idle) && (this._currentTime = this._playbackRate > 0 ? 0 : this._totalDuration, this._startTime = null, b.invalidateEffects()), this._finishedFlag = !1, b.restart(), this._idle = !1, this._ensureAlive();
},
pause: function () {
this._isFinished || this._paused || this._idle || (this._currentTimePending = !0), this._startTime = null, this._paused = !0;
},
finish: function () {
this._idle || (this.currentTime = this._playbackRate > 0 ? this._totalDuration : 0, this._startTime = this._totalDuration - this.currentTime, this._currentTimePending = !1);
},
cancel: function () {
this._inEffect && (this._inEffect = !1, this._idle = !0, this.currentTime = 0, this._startTime = null, this._effect._update(null), b.invalidateEffects(), b.restart());
},
reverse: function () {
this.playbackRate *= -1, this.play();
},
addEventListener: function (a, b) {
'function' == typeof b && 'finish' == a && this._finishHandlers.push(b);
},
removeEventListener: function (a, b) {
if ('finish' == a) {
var c = this._finishHandlers.indexOf(b);
c >= 0 && this._finishHandlers.splice(c, 1);
}
},
_fireEvents: function (a) {
var b = this._isFinished;
if ((b || this._idle) && !this._finishedFlag) {
var d = new c(this, this._currentTime, a), e = this._finishHandlers.concat(this.onfinish ? [this.onfinish] : []);
setTimeout(function () {
e.forEach(function (a) {
a.call(d.target, d);
});
}, 0);
}
this._finishedFlag = b;
},
_tick: function (a) {
return this._idle || this._paused || (null == this._startTime ? this.startTime = a - this._currentTime / this.playbackRate : this._isFinished || this._tickCurrentTime((a - this._startTime) * this.playbackRate)), this._currentTimePending = !1, this._fireEvents(a), !this._idle && (this._inEffect || !this._finishedFlag);
}
};
}(c, d, f), function (a, b) {
function c(a) {
var b = i;
i = [], a < s.currentTime && (a = s.currentTime), g(a), b.forEach(function (b) {
b[1](a);
}), o && g(a), f(), l = void 0;
}
function d(a, b) {
return a._sequenceNumber - b._sequenceNumber;
}
function e() {
this._animations = [], this.currentTime = window.performance && performance.now ? performance.now() : 0;
}
function f() {
p.forEach(function (a) {
a();
}), p.length = 0;
}
function g(a) {
n = !1;
var c = b.timeline;
c.currentTime = a, c._animations.sort(d), m = !1;
var e = c._animations;
c._animations = [];
var f = [], g = [];
e = e.filter(function (b) {
return b._inTimeline = b._tick(a), b._inEffect ? g.push(b._effect) : f.push(b._effect), b._isFinished || b._paused || b._idle || (m = !0), b._inTimeline;
}), p.push.apply(p, f), p.push.apply(p, g), c._animations.push.apply(c._animations, e), o = !1, m && requestAnimationFrame(function () {
});
}
var h = window.requestAnimationFrame, i = [], j = 0;
window.requestAnimationFrame = function (a) {
var b = j++;
return 0 == i.length && h(c), i.push([
b,
a
]), b;
}, window.cancelAnimationFrame = function (a) {
i.forEach(function (b) {
b[0] == a && (b[1] = function () {
});
});
}, e.prototype = {
_play: function (c) {
c._timing = a.normalizeTimingInput(c.timing);
var d = new b.Animation(c);
return d._idle = !1, d._timeline = this, this._animations.push(d), b.restart(), b.invalidateEffects(), d;
}
};
var k, l = void 0, k = function () {
return void 0 == l && (l = performance.now()), l;
}, m = !1, n = !1;
b.restart = function () {
return m || (m = !0, requestAnimationFrame(function () {
}), n = !0), n;
};
var o = !1;
b.invalidateEffects = function () {
o = !0;
};
var p = [], q = 1000 / 60, r = window.getComputedStyle;
Object.defineProperty(window, 'getComputedStyle', {
configurable: !0,
enumerable: !0,
value: function () {
if (o) {
var a = k();
a - s.currentTime > 0 && (s.currentTime += q * (Math.floor((a - s.currentTime) / q) + 1)), g(s.currentTime);
}
return f(), r.apply(this, arguments);
}
});
var s = new e();
b.timeline = s;
}(c, d, f), function (a) {
function b(a, b) {
var c = a.exec(b);
return c ? (c = a.ignoreCase ? c[0].toLowerCase() : c[0], [
c,
b.substr(c.length)
]) : void 0;
}
function c(a, b) {
b = b.replace(/^\s*/, '');
var c = a(b);
return c ? [
c[0],
c[1].replace(/^\s*/, '')
] : void 0;
}
function d(a, d, e) {
a = c.bind(null, a);
for (var f = [];;) {
var g = a(e);
if (!g)
return [
f,
e
];
if (f.push(g[0]), e = g[1], g = b(d, e), !g || '' == g[1])
return [
f,
e
];
e = g[1];
}
}
function e(a, b) {
for (var c = 0, d = 0; d < b.length && (!/\s|,/.test(b[d]) || 0 != c); d++)
if ('(' == b[d])
c++;
else if (')' == b[d] && (c--, 0 == c && d++, 0 >= c))
break;
var e = a(b.substr(0, d));
return void 0 == e ? void 0 : [
e,
b.substr(d)
];
}
function f(a, b) {
for (var c = a, d = b; c && d;)
c > d ? c %= d : d %= c;
return c = a * b / (c + d);
}
function g(a) {
return function (b) {
var c = a(b);
return c && (c[0] = void 0), c;
};
}
function h(a, b) {
return function (c) {
var d = a(c);
return d ? d : [
b,
c
];
};
}
function i(b, c) {
for (var d = [], e = 0; e < b.length; e++) {
var f = a.consumeTrimmed(b[e], c);
if (!f || '' == f[0])
return;
void 0 !== f[0] && d.push(f[0]), c = f[1];
}
return '' == c ? d : void 0;
}
function j(a, b, c, d, e) {
for (var g = [], h = [], i = [], j = f(d.length, e.length), k = 0; j > k; k++) {
var l = b(d[k % d.length], e[k % e.length]);
if (!l)
return;
g.push(l[0]), h.push(l[1]), i.push(l[2]);
}
return [
g,
h,
function (b) {
var d = b.map(function (a, b) {
return i[b](a);
}).join(c);
return a ? a(d) : d;
}
];
}
function k(a, b, c) {
for (var d = [], e = [], f = [], g = 0, h = 0; h < c.length; h++)
if ('function' == typeof c[h]) {
var i = c[h](a[g], b[g++]);
d.push(i[0]), e.push(i[1]), f.push(i[2]);
} else
!function (a) {
d.push(!1), e.push(!1), f.push(function () {
return c[a];
});
}(h);
return [
d,
e,
function (a) {
for (var b = '', c = 0; c < a.length; c++)
b += f[c](a[c]);
return b;
}
];
}
a.consumeToken = b, a.consumeTrimmed = c, a.consumeRepeated = d, a.consumeParenthesised = e, a.ignore = g, a.optional = h, a.consumeList = i, a.mergeNestedRepeated = j.bind(null, null), a.mergeWrappedNestedRepeated = j, a.mergeList = k;
}(d), function (a) {
function b(b) {
function c(b) {
var c = a.consumeToken(/^inset/i, b);
if (c)
return d.inset = !0, c;
var c = a.consumeLengthOrPercent(b);
if (c)
return d.lengths.push(c[0]), c;
var c = a.consumeColor(b);
return c ? (d.color = c[0], c) : void 0;
}
var d = {
inset: !1,
lengths: [],
color: null
}, e = a.consumeRepeated(c, /^/, b);
return e && e[0].length ? [
d,
e[1]
] : void 0;
}
function c(c) {
var d = a.consumeRepeated(b, /^,/, c);
return d && '' == d[1] ? d[0] : void 0;
}
function d(b, c) {
for (; b.lengths.length < Math.max(b.lengths.length, c.lengths.length);)
b.lengths.push({ px: 0 });
for (; c.lengths.length < Math.max(b.lengths.length, c.lengths.length);)
c.lengths.push({ px: 0 });
if (b.inset == c.inset && !!b.color == !!c.color) {
for (var d, e = [], f = [
[],
0
], g = [
[],
0
], h = 0; h < b.lengths.length; h++) {
var i = a.mergeDimensions(b.lengths[h], c.lengths[h], 2 == h);
f[0].push(i[0]), g[0].push(i[1]), e.push(i[2]);
}
if (b.color && c.color) {
var j = a.mergeColors(b.color, c.color);
f[1] = j[0], g[1] = j[1], d = j[2];
}
return [
f,
g,
function (a) {
for (var c = b.inset ? 'inset ' : ' ', f = 0; f < e.length; f++)
c += e[f](a[0][f]) + ' ';
return d && (c += d(a[1])), c;
}
];
}
}
function e(b, c, d, e) {
function f(a) {
return {
inset: a,
color: [
0,
0,
0,
0
],
lengths: [
{ px: 0 },
{ px: 0 },
{ px: 0 },
{ px: 0 }
]
};
}
for (var g = [], h = [], i = 0; i < d.length || i < e.length; i++) {
var j = d[i] || f(e[i].inset), k = e[i] || f(d[i].inset);
g.push(j), h.push(k);
}
return a.mergeNestedRepeated(b, c, g, h);
}
var f = e.bind(null, d, ', ');
a.addPropertiesHandler(c, f, [
'box-shadow',
'text-shadow'
]);
}(d), function (a) {
function b(a) {
return a.toFixed(3).replace('.000', '');
}
function c(a, b, c) {
return Math.min(b, Math.max(a, c));
}
function d(a) {
return /^\s*[-+]?(\d*\.)?\d+\s*$/.test(a) ? Number(a) : void 0;
}
function e(a, c) {
return [
a,
c,
b
];
}
function f(a, b) {
return 0 != a ? h(0, 1 / 0)(a, b) : void 0;
}
function g(a, b) {
return [
a,
b,
function (a) {
return Math.round(c(1, 1 / 0, a));
}
];
}
function h(a, d) {
return function (e, f) {
return [
e,
f,
function (e) {
return b(c(a, d, e));
}
];
};
}
function i(a, b) {
return [
a,
b,
Math.round
];
}
a.clamp = c, a.addPropertiesHandler(d, h(0, 1 / 0), [
'border-image-width',
'line-height'
]), a.addPropertiesHandler(d, h(0, 1), [
'opacity',
'shape-image-threshold'
]), a.addPropertiesHandler(d, f, [
'flex-grow',
'flex-shrink'
]), a.addPropertiesHandler(d, g, [
'orphans',
'widows'
]), a.addPropertiesHandler(d, i, ['z-index']), a.parseNumber = d, a.mergeNumbers = e, a.numberToString = b;
}(d, f), function (a) {
function b(a, b) {
return 'visible' == a || 'visible' == b ? [
0,
1,
function (c) {
return 0 >= c ? a : c >= 1 ? b : 'visible';
}
] : void 0;
}
a.addPropertiesHandler(String, b, ['visibility']);
}(d), function (a) {
function b(a) {
a = a.trim(), e.fillStyle = '#000', e.fillStyle = a;
var b = e.fillStyle;
if (e.fillStyle = '#fff', e.fillStyle = a, b == e.fillStyle) {
e.fillRect(0, 0, 1, 1);
var c = e.getImageData(0, 0, 1, 1).data;
e.clearRect(0, 0, 1, 1);
var d = c[3] / 255;
return [
c[0] * d,
c[1] * d,
c[2] * d,
d
];
}
}
function c(b, c) {
return [
b,
c,
function (b) {
function c(a) {
return Math.max(0, Math.min(255, a));
}
if (b[3])
for (var d = 0; 3 > d; d++)
b[d] = Math.round(c(b[d] / b[3]));
return b[3] = a.numberToString(a.clamp(0, 1, b[3])), 'rgba(' + b.join(',') + ')';
}
];
}
var d = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
d.width = d.height = 1;
var e = d.getContext('2d');
a.addPropertiesHandler(b, c, [
'background-color',
'border-bottom-color',
'border-left-color',
'border-right-color',
'border-top-color',
'color',
'outline-color',
'text-decoration-color'
]), a.consumeColor = a.consumeParenthesised.bind(null, b), a.mergeColors = c;
}(d, f), function (a, b) {
function c(a, b) {
if (b = b.trim().toLowerCase(), '0' == b && 'px'.search(a) >= 0)
return { px: 0 };
if (/^[^(]*$|^calc/.test(b)) {
b = b.replace(/calc\(/g, '(');
var c = {};
b = b.replace(a, function (a) {
return c[a] = null, 'U' + a;
});
for (var d = 'U(' + a.source + ')', e = b.replace(/[-+]?(\d*\.)?\d+/g, 'N').replace(new RegExp('N' + d, 'g'), 'D').replace(/\s[+-]\s/g, 'O').replace(/\s/g, ''), f = [
/N\*(D)/g,
/(N|D)[*/]N/g,
/(N|D)O\1/g,
/\((N|D)\)/g
], g = 0; g < f.length;)
f[g].test(e) ? (e = e.replace(f[g], '$1'), g = 0) : g++;
if ('D' == e) {
for (var h in c) {
var i = eval(b.replace(new RegExp('U' + h, 'g'), '').replace(new RegExp(d, 'g'), '*0'));
if (!isFinite(i))
return;
c[h] = i;
}
return c;
}
}
}
function d(a, b) {
return e(a, b, !0);
}
function e(b, c, d) {
var e, f = [];
for (e in b)
f.push(e);
for (e in c)
f.indexOf(e) < 0 && f.push(e);
return b = f.map(function (a) {
return b[a] || 0;
}), c = f.map(function (a) {
return c[a] || 0;
}), [
b,
c,
function (b) {
var c = b.map(function (c, e) {
return 1 == b.length && d && (c = Math.max(c, 0)), a.numberToString(c) + f[e];
}).join(' + ');
return b.length > 1 ? 'calc(' + c + ')' : c;
}
];
}
var f = 'px|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc', g = c.bind(null, new RegExp(f, 'g')), h = c.bind(null, new RegExp(f + '|%', 'g')), i = c.bind(null, /deg|rad|grad|turn/g);
a.parseLength = g, a.parseLengthOrPercent = h, a.consumeLengthOrPercent = a.consumeParenthesised.bind(null, h), a.parseAngle = i, a.mergeDimensions = e;
var j = a.consumeParenthesised.bind(null, g), k = a.consumeRepeated.bind(void 0, j, /^/), l = a.consumeRepeated.bind(void 0, k, /^,/);
a.consumeSizePairList = l;
var m = function (a) {
var b = l(a);
return b && '' == b[1] ? b[0] : void 0;
}, n = a.mergeNestedRepeated.bind(void 0, d, ' '), o = a.mergeNestedRepeated.bind(void 0, n, ',');
a.mergeNonNegativeSizePair = n, a.addPropertiesHandler(m, o, ['background-size']), a.addPropertiesHandler(h, d, [
'border-bottom-width',
'border-image-width',
'border-left-width',
'border-right-width',
'border-top-width',
'flex-basis',
'font-size',
'height',
'line-height',
'max-height',
'max-width',
'outline-width',
'width'
]), a.addPropertiesHandler(h, e, [
'border-bottom-left-radius',
'border-bottom-right-radius',
'border-top-left-radius',
'border-top-right-radius',
'bottom',
'left',
'letter-spacing',
'margin-bottom',
'margin-left',
'margin-right',
'margin-top',
'min-height',
'min-width',
'outline-offset',
'padding-bottom',
'padding-left',
'padding-right',
'padding-top',
'perspective',
'right',
'shape-margin',
'text-indent',
'top',
'vertical-align',
'word-spacing'
]);
}(d, f), function (a) {
function b(b) {
return a.consumeLengthOrPercent(b) || a.consumeToken(/^auto/, b);
}
function c(c) {
var d = a.consumeList([
a.ignore(a.consumeToken.bind(null, /^rect/)),
a.ignore(a.consumeToken.bind(null, /^\(/)),
a.consumeRepeated.bind(null, b, /^,/),
a.ignore(a.consumeToken.bind(null, /^\)/))
], c);
return d && 4 == d[0].length ? d[0] : void 0;
}
function d(b, c) {
return 'auto' == b || 'auto' == c ? [
!0,
!1,
function (d) {
var e = d ? b : c;
if ('auto' == e)
return 'auto';
var f = a.mergeDimensions(e, e);
return f[2](f[0]);
}
] : a.mergeDimensions(b, c);
}
function e(a) {
return 'rect(' + a + ')';
}
var f = a.mergeWrappedNestedRepeated.bind(null, e, d, ', ');
a.parseBox = c, a.mergeBoxes = f, a.addPropertiesHandler(c, f, ['clip']);
}(d, f), function (a) {
function b(a) {
return function (b) {
var c = 0;
return a.map(function (a) {
return a === j ? b[c++] : a;
});
};
}
function c(a) {
return a;
}
function d(b) {
if (b = b.toLowerCase().trim(), 'none' == b)
return [];
for (var c, d = /\s*(\w+)\(([^)]*)\)/g, e = [], f = 0; c = d.exec(b);) {
if (c.index != f)
return;
f = c.index + c[0].length;
var g = c[1], h = m[g];
if (!h)
return;
var i = c[2].split(','), j = h[0];
if (j.length < i.length)
return;
for (var n = [], o = 0; o < j.length; o++) {
var p, q = i[o], r = j[o];
if (p = q ? {
A: function (b) {
return '0' == b.trim() ? l : a.parseAngle(b);
},
N: a.parseNumber,
T: a.parseLengthOrPercent,
L: a.parseLength
}[r.toUpperCase()](q) : {
a: l,
n: n[0],
t: k
}[r], void 0 === p)
return;
n.push(p);
}
if (e.push({
t: g,
d: n
}), d.lastIndex == b.length)
return e;
}
}
function e(a) {
return a.toFixed(6).replace('.000000', '');
}
function f(b, c) {
if (b.decompositionPair !== c) {
b.decompositionPair = c;
var d = a.makeMatrixDecomposition(b);
}
if (c.decompositionPair !== b) {
c.decompositionPair = b;
var f = a.makeMatrixDecomposition(c);
}
return null == d[0] || null == f[0] ? [
[!1],
[!0],
function (a) {
return a ? c[0].d : b[0].d;
}
] : (d[0].push(0), f[0].push(1), [
d,
f,
function (b) {
var c = a.quat(d[0][3], f[0][3], b[5]), g = a.composeMatrix(b[0], b[1], b[2], c, b[4]), h = g.map(e).join(',');
return h;
}
]);
}
function g(a) {
return a.replace(/[xy]/, '');
}
function h(a) {
return a.replace(/(x|y|z|3d)?$/, '3d');
}
function i(b, c) {
var d = a.makeMatrixDecomposition && !0, e = !1;
if (!b.length || !c.length) {
b.length || (e = !0, b = c, c = []);
for (var i = 0; i < b.length; i++) {
var j = b[i].t, k = b[i].d, l = 'scale' == j.substr(0, 5) ? 1 : 0;
c.push({
t: j,
d: k.map(function (a) {
if ('number' == typeof a)
return l;
var b = {};
for (var c in a)
b[c] = l;
return b;
})
});
}
}
var n = function (a, b) {
return 'perspective' == a && 'perspective' == b || ('matrix' == a || 'matrix3d' == a) && ('matrix' == b || 'matrix3d' == b);
}, o = [], p = [], q = [];
if (b.length != c.length) {
if (!d)
return;
var r = f(b, c);
o = [r[0]], p = [r[1]], q = [[
'matrix',
[r[2]]
]];
} else
for (var i = 0; i < b.length; i++) {
var j, s = b[i].t, t = c[i].t, u = b[i].d, v = c[i].d, w = m[s], x = m[t];
if (n(s, t)) {
if (!d)
return;
var r = f([b[i]], [c[i]]);
o.push(r[0]), p.push(r[1]), q.push([
'matrix',
[r[2]]
]);
} else {
if (s == t)
j = s;
else if (w[2] && x[2] && g(s) == g(t))
j = g(s), u = w[2](u), v = x[2](v);
else {
if (!w[1] || !x[1] || h(s) != h(t)) {
if (!d)
return;
var r = f(b, c);
o = [r[0]], p = [r[1]], q = [[
'matrix',
[r[2]]
]];
break;
}
j = h(s), u = w[1](u), v = x[1](v);
}
for (var y = [], z = [], A = [], B = 0; B < u.length; B++) {
var C = 'number' == typeof u[B] ? a.mergeNumbers : a.mergeDimensions, r = C(u[B], v[B]);
y[B] = r[0], z[B] = r[1], A.push(r[2]);
}
o.push(y), p.push(z), q.push([
j,
A
]);
}
}
if (e) {
var D = o;
o = p, p = D;
}
return [
o,
p,
function (a) {
return a.map(function (a, b) {
var c = a.map(function (a, c) {
return q[b][1][c](a);
}).join(',');
return 'matrix' == q[b][0] && 16 == c.split(',').length && (q[b][0] = 'matrix3d'), q[b][0] + '(' + c + ')';
}).join(' ');
}
];
}
var j = null, k = { px: 0 }, l = { deg: 0 }, m = {
matrix: [
'NNNNNN',
[
j,
j,
0,
0,
j,
j,
0,
0,
0,
0,
1,
0,
j,
j,
0,
1
],
c
],
matrix3d: [
'NNNNNNNNNNNNNNNN',
c
],
rotate: ['A'],
rotatex: ['A'],
rotatey: ['A'],
rotatez: ['A'],
rotate3d: ['NNNA'],
perspective: ['L'],
scale: [
'Nn',
b([
j,
j,
1
]),
c
],
scalex: [
'N',
b([
j,
1,
1
]),
b([
j,
1
])
],
scaley: [
'N',
b([
1,
j,
1
]),
b([
1,
j
])
],
scalez: [
'N',
b([
1,
1,
j
])
],
scale3d: [
'NNN',
c
],
skew: [
'Aa',
null,
c
],
skewx: [
'A',
null,
b([
j,
l
])
],
skewy: [
'A',
null,
b([
l,
j
])
],
translate: [
'Tt',
b([
j,
j,
k
]),
c
],
translatex: [
'T',
b([
j,
k,
k
]),
b([
j,
k
])
],
translatey: [
'T',
b([
k,
j,
k
]),
b([
k,
j
])
],
translatez: [
'L',
b([
k,
k,
j
])
],
translate3d: [
'TTL',
c
]
};
a.addPropertiesHandler(d, i, ['transform']);
}(d, f), function (a) {
function b(a, b) {
b.concat([a]).forEach(function (b) {
b in document.documentElement.style && (c[a] = b);
});
}
var c = {};
b('transform', [
'webkitTransform',
'msTransform'
]), b('transformOrigin', ['webkitTransformOrigin']), b('perspective', ['webkitPerspective']), b('perspectiveOrigin', ['webkitPerspectiveOrigin']), a.propertyName = function (a) {
return c[a] || a;
};
}(d, f);
}(), !function (a, b) {
function c(a) {
var b = window.document.timeline;
b.currentTime = a, b._discardAnimations(), 0 == b._animations.length ? e = !1 : requestAnimationFrame(c);
}
var d = window.requestAnimationFrame;
window.requestAnimationFrame = function (a) {
return d(function (b) {
window.document.timeline._updateAnimationsPromises(), a(b), window.document.timeline._updateAnimationsPromises();
});
}, b.AnimationTimeline = function () {
this._animations = [], this.currentTime = void 0;
}, b.AnimationTimeline.prototype = {
getAnimations: function () {
return this._discardAnimations(), this._animations.slice();
},
_updateAnimationsPromises: function () {
b.animationsWithPromises = b.animationsWithPromises.filter(function (a) {
return a._updatePromises();
});
},
_discardAnimations: function () {
this._updateAnimationsPromises(), this._animations = this._animations.filter(function (a) {
return 'finished' != a.playState && 'idle' != a.playState;
});
},
_play: function (a) {
var c = new b.Animation(a, this);
return this._animations.push(c), b.restartWebAnimationsNextTick(), c._updatePromises(), c._animation.play(), c._updatePromises(), c;
},
play: function (a) {
return a && a.remove(), this._play(a);
}
};
var e = !1;
b.restartWebAnimationsNextTick = function () {
e || (e = !0, requestAnimationFrame(c));
};
var f = new b.AnimationTimeline();
b.timeline = f;
try {
Object.defineProperty(window.document, 'timeline', {
configurable: !0,
get: function () {
return f;
}
});
} catch (g) {
}
try {
window.document.timeline = f;
} catch (g) {
}
}(c, e, f), function (a, b) {
b.animationsWithPromises = [], b.Animation = function (b, c) {
if (this.effect = b, b && (b._animation = this), !c)
throw new Error('Animation with null timeline is not supported');
this._timeline = c, this._sequenceNumber = a.sequenceNumber++, this._holdTime = 0, this._paused = !1, this._isGroup = !1, this._animation = null, this._childAnimations = [], this._callback = null, this._oldPlayState = 'idle', this._rebuildUnderlyingAnimation(), this._animation.cancel(), this._updatePromises();
}, b.Animation.prototype = {
_updatePromises: function () {
var a = this._oldPlayState, b = this.playState;
return this._readyPromise && b !== a && ('idle' == b ? (this._rejectReadyPromise(), this._readyPromise = void 0) : 'pending' == a ? this._resolveReadyPromise() : 'pending' == b && (this._readyPromise = void 0)), this._finishedPromise && b !== a && ('idle' == b ? (this._rejectFinishedPromise(), this._finishedPromise = void 0) : 'finished' == b ? this._resolveFinishedPromise() : 'finished' == a && (this._finishedPromise = void 0)), this._oldPlayState = this.playState, this._readyPromise || this._finishedPromise;
},
_rebuildUnderlyingAnimation: function () {
this._updatePromises();
var a, c, d, e, f = this._animation ? !0 : !1;
f && (a = this.playbackRate, c = this._paused, d = this.startTime, e = this.currentTime, this._animation.cancel(), this._animation._wrapper = null, this._animation = null), (!this.effect || this.effect instanceof window.KeyframeEffect) && (this._animation = b.newUnderlyingAnimationForKeyframeEffect(this.effect), b.bindAnimationForKeyframeEffect(this)), (this.effect instanceof window.SequenceEffect || this.effect instanceof window.GroupEffect) && (this._animation = b.newUnderlyingAnimationForGroup(this.effect), b.bindAnimationForGroup(this)), this.effect && this.effect._onsample && b.bindAnimationForCustomEffect(this), f && (1 != a && (this.playbackRate = a), null !== d ? this.startTime = d : null !== e ? this.currentTime = e : null !== this._holdTime && (this.currentTime = this._holdTime), c && this.pause()), this._updatePromises();
},
_updateChildren: function () {
if (this.effect && 'idle' != this.playState) {
var a = this.effect._timing.delay;
this._childAnimations.forEach(function (c) {
this._arrangeChildren(c, a), this.effect instanceof window.SequenceEffect && (a += b.groupChildDuration(c.effect));
}.bind(this));
}
},
_setExternalAnimation: function (a) {
if (this.effect && this._isGroup)
for (var b = 0; b < this.effect.children.length; b++)
this.effect.children[b]._animation = a, this._childAnimations[b]._setExternalAnimation(a);
},
_constructChildAnimations: function () {
if (this.effect && this._isGroup) {
var a = this.effect._timing.delay;
this._removeChildAnimations(), this.effect.children.forEach(function (c) {
var d = window.document.timeline._play(c);
this._childAnimations.push(d), d.playbackRate = this.playbackRate, this._paused && d.pause(), c._animation = this.effect._animation, this._arrangeChildren(d, a), this.effect instanceof window.SequenceEffect && (a += b.groupChildDuration(c));
}.bind(this));
}
},
_arrangeChildren: function (a, b) {
null === this.startTime ? a.currentTime = this.currentTime - b / this.playbackRate : a.startTime !== this.startTime + b / this.playbackRate && (a.startTime = this.startTime + b / this.playbackRate);
},
get timeline() {
return this._timeline;
},
get playState() {
return this._animation ? this._animation.playState : 'idle';
},
get finished() {
return window.Promise ? (this._finishedPromise || (-1 == b.animationsWithPromises.indexOf(this) && b.animationsWithPromises.push(this), this._finishedPromise = new Promise(function (a, b) {
this._resolveFinishedPromise = function () {
a(this);
}, this._rejectFinishedPromise = function () {
b({
type: DOMException.ABORT_ERR,
name: 'AbortError'
});
};
}.bind(this)), 'finished' == this.playState && this._resolveFinishedPromise()), this._finishedPromise) : (console.warn('Animation Promises require JavaScript Promise constructor'), null);
},
get ready() {
return window.Promise ? (this._readyPromise || (-1 == b.animationsWithPromises.indexOf(this) && b.animationsWithPromises.push(this), this._readyPromise = new Promise(function (a, b) {
this._resolveReadyPromise = function () {
a(this);
}, this._rejectReadyPromise = function () {
b({
type: DOMException.ABORT_ERR,
name: 'AbortError'
});
};
}.bind(this)), 'pending' !== this.playState && this._resolveReadyPromise()), this._readyPromise) : (console.warn('Animation Promises require JavaScript Promise constructor'), null);
},
get onfinish() {
return this._onfinish;
},
set onfinish(a) {
'function' == typeof a ? (this._onfinish = a, this._animation.onfinish = function (b) {
b.target = this, a.call(this, b);
}.bind(this)) : (this._animation.onfinish = a, this.onfinish = this._animation.onfinish);
},
get currentTime() {
this._updatePromises();
var a = this._animation.currentTime;
return this._updatePromises(), a;
},
set currentTime(a) {
this._updatePromises(), this._animation.currentTime = isFinite(a) ? a : Math.sign(a) * Number.MAX_VALUE, this._register(), this._forEachChild(function (b, c) {
b.currentTime = a - c;
}), this._updatePromises();
},
get startTime() {
return this._animation.startTime;
},
set startTime(a) {
this._updatePromises(), this._animation.startTime = isFinite(a) ? a : Math.sign(a) * Number.MAX_VALUE, this._register(), this._forEachChild(function (b, c) {
b.startTime = a + c;
}), this._updatePromises();
},
get playbackRate() {
return this._animation.playbackRate;
},
set playbackRate(a) {
this._updatePromises();
var b = this.currentTime;
this._animation.playbackRate = a, this._forEachChild(function (b) {
b.playbackRate = a;
}), 'paused' != this.playState && 'idle' != this.playState && this.play(), null !== b && (this.currentTime = b), this._updatePromises();
},
play: function () {
this._updatePromises(), this._paused = !1, this._animation.play(), -1 == this._timeline._animations.indexOf(this) && this._timeline._animations.push(this), this._register(), b.awaitStartTime(this), this._forEachChild(function (a) {
var b = a.currentTime;
a.play(), a.currentTime = b;
}), this._updatePromises();
},
pause: function () {
this._updatePromises(), this.currentTime && (this._holdTime = this.currentTime), this._animation.pause(), this._register(), this._forEachChild(function (a) {
a.pause();
}), this._paused = !0, this._updatePromises();
},
finish: function () {
this._updatePromises(), this._animation.finish(), this._register(), this._updatePromises();
},
cancel: function () {
this._updatePromises(), this._animation.cancel(), this._register(), this._removeChildAnimations(), this._updatePromises();
},
reverse: function () {
this._updatePromises();
var a = this.currentTime;
this._animation.reverse(), this._forEachChild(function (a) {
a.reverse();
}), null !== a && (this.currentTime = a), this._updatePromises();
},
addEventListener: function (a, b) {
var c = b;
'function' == typeof b && (c = function (a) {
a.target = this, b.call(this, a);
}.bind(this), b._wrapper = c), this._animation.addEventListener(a, c);
},
removeEventListener: function (a, b) {
this._animation.removeEventListener(a, b && b._wrapper || b);
},
_removeChildAnimations: function () {
for (; this._childAnimations.length;)
this._childAnimations.pop().cancel();
},
_forEachChild: function (b) {
var c = 0;
if (this.effect.children && this._childAnimations.length < this.effect.children.length && this._constructChildAnimations(), this._childAnimations.forEach(function (a) {
b.call(this, a, c), this.effect instanceof window.SequenceEffect && (c += a.effect.activeDuration);
}.bind(this)), 'pending' != this.playState) {
var d = this.effect._timing, e = this.currentTime;
null !== e && (e = a.calculateTimeFraction(a.calculateActiveDuration(d), e, d)), (null == e || isNaN(e)) && this._removeChildAnimations();
}
}
}, window.Animation = b.Animation;
}(c, e, f), function (a, b) {
function c(b) {
this._frames = a.normalizeKeyframes(b);
}
function d() {
for (var a = !1; h.length;) {
var b = h.shift();
b._updateChildren(), a = !0;
}
return a;
}
var e = function (a) {
if (a._animation = void 0, a instanceof window.SequenceEffect || a instanceof window.GroupEffect)
for (var b = 0; b < a.children.length; b++)
e(a.children[b]);
};
b.removeMulti = function (a) {
for (var b = [], c = 0; c < a.length; c++) {
var d = a[c];
d._parent ? (-1 == b.indexOf(d._parent) && b.push(d._parent), d._parent.children.splice(d._parent.children.indexOf(d), 1), d._parent = null, e(d)) : d._animation && d._animation.effect == d && (d._animation.cancel(), d._animation.effect = new KeyframeEffect(null, []), d._animation._callback && (d._animation._callback._animation = null), d._animation._rebuildUnderlyingAnimation(), e(d));
}
for (c = 0; c < b.length; c++)
b[c]._rebuild();
}, b.KeyframeEffect = function (b, d, e) {
return this.target = b, this._parent = null, e = a.numericTimingToObject(e), this._timingInput = a.cloneTimingInput(e), this._timing = a.normalizeTimingInput(e), this.timing = a.makeTiming(e, !1, this), this.timing._effect = this, 'function' == typeof d ? (a.deprecated('Custom KeyframeEffect', '2015-06-22', 'Use KeyframeEffect.onsample instead.'), this._normalizedKeyframes = d) : this._normalizedKeyframes = new c(d), this._keyframes = d, this.activeDuration = a.calculateActiveDuration(this._timing), this;
}, b.KeyframeEffect.prototype = {
getFrames: function () {
return 'function' == typeof this._normalizedKeyframes ? this._normalizedKeyframes : this._normalizedKeyframes._frames;
},
set onsample(a) {
if ('function' == typeof this.getFrames())
throw new Error('Setting onsample on custom effect KeyframeEffect is not supported.');
this._onsample = a, this._animation && this._animation._rebuildUnderlyingAnimation();
},
get parent() {
return this._parent;
},
clone: function () {
if ('function' == typeof this.getFrames())
throw new Error('Cloning custom effects is not supported.');
var b = new KeyframeEffect(this.target, [], a.cloneTimingInput(this._timingInput));
return b._normalizedKeyframes = this._normalizedKeyframes, b._keyframes = this._keyframes, b;
},
remove: function () {
b.removeMulti([this]);
}
};
var f = Element.prototype.animate;
Element.prototype.animate = function (a, c) {
return b.timeline._play(new b.KeyframeEffect(this, a, c));
};
var g = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
b.newUnderlyingAnimationForKeyframeEffect = function (a) {
if (a) {
var b = a.target || g, c = a._keyframes;
'function' == typeof c && (c = []);
var d = a._timingInput;
} else
var b = g, c = [], d = 0;
return f.apply(b, [
c,
d
]);
}, b.bindAnimationForKeyframeEffect = function (a) {
a.effect && 'function' == typeof a.effect._normalizedKeyframes && b.bindAnimationForCustomEffect(a);
};
var h = [];
b.awaitStartTime = function (a) {
null === a.startTime && a._isGroup && (0 == h.length && requestAnimationFrame(d), h.push(a));
};
var i = window.getComputedStyle;
Object.defineProperty(window, 'getComputedStyle', {
configurable: !0,
enumerable: !0,
value: function () {
window.document.timeline._updateAnimationsPromises();
var a = i.apply(this, arguments);
return d() && (a = i.apply(this, arguments)), window.document.timeline._updateAnimationsPromises(), a;
}
}), window.KeyframeEffect = b.KeyframeEffect, window.Element.prototype.getAnimations = function () {
return document.timeline.getAnimations().filter(function (a) {
return null !== a.effect && a.effect.target == this;
}.bind(this));
};
}(c, e, f), function (a, b) {
function c(a) {
a._registered || (a._registered = !0, f.push(a), g || (g = !0, requestAnimationFrame(d)));
}
function d() {
var a = f;
f = [], a.sort(function (a, b) {
return a._sequenceNumber - b._sequenceNumber;
}), a = a.filter(function (a) {
a();
var b = a._animation ? a._animation.playState : 'idle';
return 'running' != b && 'pending' != b && (a._registered = !1), a._registered;
}), f.push.apply(f, a), f.length ? (g = !0, requestAnimationFrame(d)) : g = !1;
}
var e = (document.createElementNS('http://www.w3.org/1999/xhtml', 'div'), 0);
b.bindAnimationForCustomEffect = function (b) {
var d, f = b.effect.target, g = 'function' == typeof b.effect.getFrames();
d = g ? b.effect.getFrames() : b.effect._onsample;
var h = b.effect.timing, i = null;
h = a.normalizeTimingInput(h);
var j = function () {
var c = j._animation ? j._animation.currentTime : null;
null !== c && (c = a.calculateTimeFraction(a.calculateActiveDuration(h), c, h), isNaN(c) && (c = null)), c !== i && (g ? d(c, f, b.effect) : d(c, b.effect, b.effect._animation)), i = c;
};
j._animation = b, j._registered = !1, j._sequenceNumber = e++, b._callback = j, c(j);
};
var f = [], g = !1;
b.Animation.prototype._register = function () {
this._callback && c(this._callback);
};
}(c, e, f), function (a, b) {
function c(a) {
return a._timing.delay + a.activeDuration + a._timing.endDelay;
}
function d(b, c) {
this._parent = null, this.children = b || [], this._reparent(this.children), c = a.numericTimingToObject(c), this._timingInput = a.cloneTimingInput(c), this._timing = a.normalizeTimingInput(c, !0), this.timing = a.makeTiming(c, !0, this), this.timing._effect = this, 'auto' === this._timing.duration && (this._timing.duration = this.activeDuration);
}
window.SequenceEffect = function () {
d.apply(this, arguments);
}, window.GroupEffect = function () {
d.apply(this, arguments);
}, d.prototype = {
_isAncestor: function (a) {
for (var b = this; null !== b;) {
if (b == a)
return !0;
b = b._parent;
}
return !1;
},
_rebuild: function () {
for (var a = this; a;)
'auto' === a.timing.duration && (a._timing.duration = a.activeDuration), a = a._parent;
this._animation && this._animation._rebuildUnderlyingAnimation();
},
_reparent: function (a) {
b.removeMulti(a);
for (var c = 0; c < a.length; c++)
a[c]._parent = this;
},
_putChild: function (a, b) {
for (var c = b ? 'Cannot append an ancestor or self' : 'Cannot prepend an ancestor or self', d = 0; d < a.length; d++)
if (this._isAncestor(a[d]))
throw {
type: DOMException.HIERARCHY_REQUEST_ERR,
name: 'HierarchyRequestError',
message: c
};
for (var d = 0; d < a.length; d++)
b ? this.children.push(a[d]) : this.children.unshift(a[d]);
this._reparent(a), this._rebuild();
},
append: function () {
this._putChild(arguments, !0);
},
prepend: function () {
this._putChild(arguments, !1);
},
get parent() {
return this._parent;
},
get firstChild() {
return this.children.length ? this.children[0] : null;
},
get lastChild() {
return this.children.length ? this.children[this.children.length - 1] : null;
},
clone: function () {
for (var b = a.cloneTimingInput(this._timingInput), c = [], d = 0; d < this.children.length; d++)
c.push(this.children[d].clone());
return this instanceof GroupEffect ? new GroupEffect(c, b) : new SequenceEffect(c, b);
},
remove: function () {
b.removeMulti([this]);
}
}, window.SequenceEffect.prototype = Object.create(d.prototype), Object.defineProperty(window.SequenceEffect.prototype, 'activeDuration', {
get: function () {
var a = 0;
return this.children.forEach(function (b) {
a += c(b);
}), Math.max(a, 0);
}
}), window.GroupEffect.prototype = Object.create(d.prototype), Object.defineProperty(window.GroupEffect.prototype, 'activeDuration', {
get: function () {
var a = 0;
return this.children.forEach(function (b) {
a = Math.max(a, c(b));
}), a;
}
}), b.newUnderlyingAnimationForGroup = function (c) {
var d, e = null, f = function (b) {
var c = d._wrapper;
return c && 'pending' != c.playState && c.effect ? null == b ? void c._removeChildAnimations() : 0 == b && c.playbackRate < 0 && (e || (e = a.normalizeTimingInput(c.effect.timing)), b = a.calculateTimeFraction(a.calculateActiveDuration(e), -1, e), isNaN(b) || null == b) ? (c._forEachChild(function (a) {
a.currentTime = -1;
}), void c._removeChildAnimations()) : void 0 : void 0;
}, g = new KeyframeEffect(null, [], c._timing);
return g.onsample = f, d = b.timeline._play(g);
}, b.bindAnimationForGroup = function (a) {
a._animation._wrapper = a, a._isGroup = !0, b.awaitStartTime(a), a._constructChildAnimations(), a._setExternalAnimation(a);
}, b.groupChildDuration = c;
}(c, e, f);
}({}, function () {
return this;
}());
;Polymer({
is: 'opaque-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
node.style.opacity = '0';
this._effect = new KeyframeEffect(node, [
{ 'opacity': '1' },
{ 'opacity': '1' }
], this.timingFromConfig(config));
return this._effect;
},
complete: function (config) {
config.node.style.opacity = '';
}
});
;Polymer.NeonAnimatableBehavior = {
properties: {
animationConfig: { type: Object },
entryAnimation: {
observer: '_entryAnimationChanged',
type: String
},
exitAnimation: {
observer: '_exitAnimationChanged',
type: String
}
},
_entryAnimationChanged: function () {
this.animationConfig = this.animationConfig || {};
if (this.entryAnimation !== 'fade-in-animation') {
this.animationConfig['entry'] = [
{
name: 'opaque-animation',
node: this
},
{
name: this.entryAnimation,
node: this
}
];
} else {
this.animationConfig['entry'] = [{
name: this.entryAnimation,
node: this
}];
}
},
_exitAnimationChanged: function () {
this.animationConfig = this.animationConfig || {};
this.animationConfig['exit'] = [{
name: this.exitAnimation,
node: this
}];
},
_copyProperties: function (config1, config2) {
for (var property in config2) {
config1[property] = config2[property];
}
},
_cloneConfig: function (config) {
var clone = { isClone: true };
this._copyProperties(clone, config);
return clone;
},
_getAnimationConfigRecursive: function (type, map, allConfigs) {
if (!this.animationConfig) {
return;
}
var thisConfig;
if (type) {
thisConfig = this.animationConfig[type];
} else {
thisConfig = this.animationConfig;
}
if (!Array.isArray(thisConfig)) {
thisConfig = [thisConfig];
}
if (thisConfig) {
for (var config, index = 0; config = thisConfig[index]; index++) {
if (config.animatable) {
config.animatable._getAnimationConfigRecursive(config.type || type, map, allConfigs);
} else {
if (config.id) {
var cachedConfig = map[config.id];
if (cachedConfig) {
if (!cachedConfig.isClone) {
map[config.id] = this._cloneConfig(cachedConfig);
cachedConfig = map[config.id];
}
this._copyProperties(cachedConfig, config);
} else {
map[config.id] = config;
}
} else {
allConfigs.push(config);
}
}
}
}
},
getAnimationConfig: function (type) {
var map = [];
var allConfigs = [];
this._getAnimationConfigRecursive(type, map, allConfigs);
for (var key in map) {
allConfigs.push(map[key]);
}
return allConfigs;
}
};
;Polymer.NeonAnimationRunnerBehaviorImpl = {
properties: {
_animationMeta: {
type: Object,
value: function () {
return new Polymer.IronMeta({ type: 'animation' });
}
},
_player: { type: Object }
},
_configureAnimationEffects: function (allConfigs) {
var allAnimations = [];
if (allConfigs.length > 0) {
for (var config, index = 0; config = allConfigs[index]; index++) {
var animationConstructor = this._animationMeta.byKey(config.name);
if (animationConstructor) {
var animation = animationConstructor && new animationConstructor();
var effect = animation.configure(config);
if (effect) {
allAnimations.push({
animation: animation,
config: config,
effect: effect
});
}
} else {
console.warn(this.is + ':', config.name, 'not found!');
}
}
}
return allAnimations;
},
_runAnimationEffects: function (allEffects) {
return document.timeline.play(new GroupEffect(allEffects));
},
_completeAnimations: function (allAnimations) {
for (var animation, index = 0; animation = allAnimations[index]; index++) {
animation.animation.complete(animation.config);
}
},
playAnimation: function (type, cookie) {
var allConfigs = this.getAnimationConfig(type);
if (!allConfigs) {
return;
}
var allAnimations = this._configureAnimationEffects(allConfigs);
var allEffects = allAnimations.map(function (animation) {
return animation.effect;
});
if (allEffects.length > 0) {
this._player = this._runAnimationEffects(allEffects);
this._player.onfinish = function () {
this._completeAnimations(allAnimations);
if (this._player) {
this._player.cancel();
this._player = null;
}
this.fire('neon-animation-finish', cookie, { bubbles: false });
}.bind(this);
} else {
this.fire('neon-animation-finish', cookie, { bubbles: false });
}
},
cancelAnimation: function () {
if (this._player) {
this._player.cancel();
}
}
};
Polymer.NeonAnimationRunnerBehavior = [
Polymer.NeonAnimatableBehavior,
Polymer.NeonAnimationRunnerBehaviorImpl
];
;(function () {
'use strict';
Polymer.IronDropdownScrollManager = {
get currentLockingElement() {
return this._lockingElements[this._lockingElements.length - 1];
},
elementIsScrollLocked: function (element) {
var currentLockingElement = this.currentLockingElement;
var scrollLocked;
if (this._hasCachedLockedElement(element)) {
return true;
}
if (this._hasCachedUnlockedElement(element)) {
return false;
}
scrollLocked = !!currentLockingElement && currentLockingElement !== element && !this._composedTreeContains(currentLockingElement, element);
if (scrollLocked) {
this._lockedElementCache.push(element);
} else {
this._unlockedElementCache.push(element);
}
return scrollLocked;
},
pushScrollLock: function (element) {
if (this._lockingElements.length === 0) {
this._lockScrollInteractions();
}
this._lockingElements.push(element);
this._lockedElementCache = [];
this._unlockedElementCache = [];
},
removeScrollLock: function (element) {
var index = this._lockingElements.indexOf(element);
if (index === -1) {
return;
}
this._lockingElements.splice(index, 1);
this._lockedElementCache = [];
this._unlockedElementCache = [];
if (this._lockingElements.length === 0) {
this._unlockScrollInteractions();
}
},
_lockingElements: [],
_lockedElementCache: null,
_unlockedElementCache: null,
_originalBodyStyles: {},
_isScrollingKeypress: function (event) {
return Polymer.IronA11yKeysBehavior.keyboardEventMatchesKeys(event, 'pageup pagedown home end up left down right');
},
_hasCachedLockedElement: function (element) {
return this._lockedElementCache.indexOf(element) > -1;
},
_hasCachedUnlockedElement: function (element) {
return this._unlockedElementCache.indexOf(element) > -1;
},
_composedTreeContains: function (element, child) {
var contentElements;
var distributedNodes;
var contentIndex;
var nodeIndex;
if (element.contains(child)) {
return true;
}
contentElements = Polymer.dom(element).querySelectorAll('content');
for (contentIndex = 0; contentIndex < contentElements.length; ++contentIndex) {
distributedNodes = Polymer.dom(contentElements[contentIndex]).getDistributedNodes();
for (nodeIndex = 0; nodeIndex < distributedNodes.length; ++nodeIndex) {
if (this._composedTreeContains(distributedNodes[nodeIndex], child)) {
return true;
}
}
}
return false;
},
_scrollInteractionHandler: function (event) {
if (Polymer.IronDropdownScrollManager.elementIsScrollLocked(event.target)) {
if (event.type === 'keydown' && !Polymer.IronDropdownScrollManager._isScrollingKeypress(event)) {
return;
}
event.preventDefault();
}
},
_lockScrollInteractions: function () {
this._originalBodyStyles.overflow = document.body.style.overflow;
this._originalBodyStyles.overflowX = document.body.style.overflowX;
this._originalBodyStyles.overflowY = document.body.style.overflowY;
document.body.style.overflow = 'hidden';
document.body.style.overflowX = 'hidden';
document.body.style.overflowY = 'hidden';
window.addEventListener('wheel', this._scrollInteractionHandler, true);
window.addEventListener('mousewheel', this._scrollInteractionHandler, true);
window.addEventListener('DOMMouseScroll', this._scrollInteractionHandler, true);
window.addEventListener('touchmove', this._scrollInteractionHandler, true);
document.addEventListener('keydown', this._scrollInteractionHandler, true);
},
_unlockScrollInteractions: function () {
document.body.style.overflow = this._originalBodyStyles.overflow;
document.body.style.overflowX = this._originalBodyStyles.overflowX;
document.body.style.overflowY = this._originalBodyStyles.overflowY;
window.removeEventListener('wheel', this._scrollInteractionHandler, true);
window.removeEventListener('mousewheel', this._scrollInteractionHandler, true);
window.removeEventListener('DOMMouseScroll', this._scrollInteractionHandler, true);
window.removeEventListener('touchmove', this._scrollInteractionHandler, true);
document.removeEventListener('keydown', this._scrollInteractionHandler, true);
}
};
}());
;Polymer({
is: 'fade-in-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
this._effect = new KeyframeEffect(node, [
{ 'opacity': '0' },
{ 'opacity': '1' }
], this.timingFromConfig(config));
return this._effect;
}
});
;Polymer({
is: 'fade-out-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
this._effect = new KeyframeEffect(node, [
{ 'opacity': '1' },
{ 'opacity': '0' }
], this.timingFromConfig(config));
return this._effect;
}
});
;Polymer({
is: 'paper-menu-grow-height-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
var rect = node.getBoundingClientRect();
var height = rect.height;
this._effect = new KeyframeEffect(node, [
{ height: height / 2 + 'px' },
{ height: height + 'px' }
], this.timingFromConfig(config));
return this._effect;
}
});
Polymer({
is: 'paper-menu-grow-width-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
var rect = node.getBoundingClientRect();
var width = rect.width;
this._effect = new KeyframeEffect(node, [
{ width: width / 2 + 'px' },
{ width: width + 'px' }
], this.timingFromConfig(config));
return this._effect;
}
});
Polymer({
is: 'paper-menu-shrink-width-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
var rect = node.getBoundingClientRect();
var width = rect.width;
this._effect = new KeyframeEffect(node, [
{ width: width + 'px' },
{ width: width - width / 20 + 'px' }
], this.timingFromConfig(config));
return this._effect;
}
});
Polymer({
is: 'paper-menu-shrink-height-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
var rect = node.getBoundingClientRect();
var height = rect.height;
var top = rect.top;
this.setPrefixedProperty(node, 'transformOrigin', '0 0');
this._effect = new KeyframeEffect(node, [
{
height: height + 'px',
transform: 'translateY(0)'
},
{
height: height / 2 + 'px',
transform: 'translateY(-20px)'
}
], this.timingFromConfig(config));
return this._effect;
}
});
;Polymer.IronValidatableBehavior = {
properties: {
validatorType: {
type: String,
value: 'validator'
},
validator: { type: String },
invalid: {
notify: true,
reflectToAttribute: true,
type: Boolean,
value: false
},
_validatorMeta: { type: Object }
},
observers: ['_invalidChanged(invalid)'],
get _validator() {
return this._validatorMeta && this._validatorMeta.byKey(this.validator);
},
ready: function () {
this._validatorMeta = new Polymer.IronMeta({ type: this.validatorType });
},
_invalidChanged: function () {
if (this.invalid) {
this.setAttribute('aria-invalid', 'true');
} else {
this.removeAttribute('aria-invalid');
}
},
hasValidator: function () {
return this._validator != null;
},
validate: function (value) {
this.invalid = !this._getValidity(value);
return !this.invalid;
},
_getValidity: function (value) {
if (this.hasValidator()) {
return this._validator.validate(value);
}
return true;
}
};
;Polymer({
is: 'iron-input',
extends: 'input',
behaviors: [Polymer.IronValidatableBehavior],
properties: {
bindValue: {
observer: '_bindValueChanged',
type: String
},
preventInvalidInput: { type: Boolean },
allowedPattern: { type: String },
_previousValidInput: {
type: String,
value: ''
},
_patternAlreadyChecked: {
type: Boolean,
value: false
}
},
listeners: {
'input': '_onInput',
'keypress': '_onKeypress'
},
get _patternRegExp() {
var pattern;
if (this.allowedPattern) {
pattern = new RegExp(this.allowedPattern);
} else if (this.pattern) {
pattern = new RegExp(this.pattern);
} else {
switch (this.type) {
case 'number':
pattern = /[0-9.,e-]/;
break;
}
}
return pattern;
},
ready: function () {
this.bindValue = this.value;
},
_bindValueChanged: function () {
if (this.value !== this.bindValue) {
this.value = !(this.bindValue || this.bindValue === 0) ? '' : this.bindValue;
}
this.fire('bind-value-changed', { value: this.bindValue });
},
_onInput: function () {
if (this.preventInvalidInput && !this._patternAlreadyChecked) {
var valid = this._checkPatternValidity();
if (!valid) {
this.value = this._previousValidInput;
}
}
this.bindValue = this.value;
this._previousValidInput = this.value;
this._patternAlreadyChecked = false;
},
_isPrintable: function (event) {
var anyNonPrintable = event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 13 || event.keyCode == 27;
var mozNonPrintable = event.keyCode == 19 || event.keyCode == 20 || event.keyCode == 45 || event.keyCode == 46 || event.keyCode == 144 || event.keyCode == 145 || event.keyCode > 32 && event.keyCode < 41 || event.keyCode > 111 && event.keyCode < 124;
return !anyNonPrintable && !(event.charCode == 0 && mozNonPrintable);
},
_onKeypress: function (event) {
if (!this.preventInvalidInput && this.type !== 'number') {
return;
}
var regexp = this._patternRegExp;
if (!regexp) {
return;
}
if (event.metaKey || event.ctrlKey || event.altKey)
return;
this._patternAlreadyChecked = true;
var thisChar = String.fromCharCode(event.charCode);
if (this._isPrintable(event) && !regexp.test(thisChar)) {
event.preventDefault();
}
},
_checkPatternValidity: function () {
var regexp = this._patternRegExp;
if (!regexp) {
return true;
}
for (var i = 0; i < this.value.length; i++) {
if (!regexp.test(this.value[i])) {
return false;
}
}
return true;
},
validate: function () {
if (!this.required && this.value == '') {
this.invalid = false;
return true;
}
var valid;
if (this.hasValidator()) {
valid = Polymer.IronValidatableBehavior.validate.call(this, this.value);
} else {
this.invalid = !this.validity.valid;
valid = this.validity.valid;
}
this.fire('iron-input-validate');
return valid;
}
});
;Polymer.IronFormElementBehavior = {
properties: {
name: { type: String },
value: {
notify: true,
type: String
},
required: {
type: Boolean,
value: false
},
_parentForm: { type: Object }
},
attached: function () {
this.fire('iron-form-element-register');
},
detached: function () {
if (this._parentForm) {
this._parentForm.fire('iron-form-element-unregister', { target: this });
}
}
};
;Polymer.PaperInputBehaviorImpl = {
properties: {
label: { type: String },
value: {
notify: true,
type: String
},
disabled: {
type: Boolean,
value: false
},
invalid: {
type: Boolean,
value: false,
notify: true
},
preventInvalidInput: { type: Boolean },
allowedPattern: { type: String },
type: { type: String },
list: { type: String },
pattern: { type: String },
required: {
type: Boolean,
value: false
},
errorMessage: { type: String },
charCounter: {
type: Boolean,
value: false
},
noLabelFloat: {
type: Boolean,
value: false
},
alwaysFloatLabel: {
type: Boolean,
value: false
},
autoValidate: {
type: Boolean,
value: false
},
validator: { type: String },
autocomplete: {
type: String,
value: 'off'
},
autofocus: { type: Boolean },
inputmode: { type: String },
minlength: { type: Number },
maxlength: { type: Number },
min: { type: String },
max: { type: String },
step: { type: String },
name: { type: String },
placeholder: {
type: String,
value: ''
},
readonly: {
type: Boolean,
value: false
},
size: { type: Number },
autocapitalize: {
type: String,
value: 'none'
},
autocorrect: {
type: String,
value: 'off'
},
_ariaDescribedBy: {
type: String,
value: ''
}
},
listeners: { 'addon-attached': '_onAddonAttached' },
observers: ['_focusedControlStateChanged(focused)'],
get inputElement() {
return this.$.input;
},
attached: function () {
this._updateAriaLabelledBy();
},
_appendStringWithSpace: function (str, more) {
if (str) {
str = str + ' ' + more;
} else {
str = more;
}
return str;
},
_onAddonAttached: function (event) {
var target = event.path ? event.path[0] : event.target;
if (target.id) {
this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, target.id);
} else {
var id = 'paper-input-add-on-' + Math.floor(Math.random() * 100000);
target.id = id;
this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, id);
}
},
validate: function () {
return this.inputElement.validate();
},
_handleAutoValidate: function () {
if (this.autoValidate)
this.validate();
},
updateValueAndPreserveCaret: function (newValue) {
try {
var start = this.inputElement.selectionStart;
this.value = newValue;
this.inputElement.selectionStart = start;
this.inputElement.selectionEnd = start;
} catch (e) {
this.value = newValue;
}
},
_computeAlwaysFloatLabel: function (alwaysFloatLabel, placeholder) {
return placeholder || alwaysFloatLabel;
},
_focusedControlStateChanged: function (focused) {
if (!this.$.container) {
this.$.container = Polymer.dom(this.root).querySelector('paper-input-container');
if (!this.$.container) {
return;
}
}
if (focused) {
this.$.container._onFocus();
} else {
this.$.container._onBlur();
}
},
_updateAriaLabelledBy: function () {
var label = Polymer.dom(this.root).querySelector('label');
if (!label) {
this._ariaLabelledBy = '';
return;
}
var labelledBy;
if (label.id) {
labelledBy = label.id;
} else {
labelledBy = 'paper-input-label-' + new Date().getUTCMilliseconds();
label.id = labelledBy;
}
this._ariaLabelledBy = labelledBy;
},
_onChange: function (event) {
if (this.shadowRoot) {
this.fire(event.type, { sourceEvent: event }, {
node: this,
bubbles: event.bubbles,
cancelable: event.cancelable
});
}
}
};
Polymer.PaperInputBehavior = [
Polymer.IronControlState,
Polymer.PaperInputBehaviorImpl
];
;Polymer.PaperInputAddonBehavior = {
hostAttributes: { 'add-on': '' },
attached: function () {
this.fire('addon-attached');
},
update: function (state) {
}
};
;(function () {
'use strict';
var sharedPanel = null;
function classNames(obj) {
var classes = [];
for (var key in obj) {
if (obj.hasOwnProperty(key) && obj[key]) {
classes.push(key);
}
}
return classes.join(' ');
}
Polymer({
is: 'paper-drawer-panel',
properties: {
defaultSelected: {
type: String,
value: 'main'
},
disableEdgeSwipe: {
type: Boolean,
value: false
},
disableSwipe: {
type: Boolean,
value: false
},
dragging: {
type: Boolean,
value: false,
readOnly: true,
notify: true
},
drawerWidth: {
type: String,
value: '256px'
},
edgeSwipeSensitivity: {
type: Number,
value: 30
},
forceNarrow: {
type: Boolean,
value: false
},
hasTransform: {
type: Boolean,
value: function () {
return 'transform' in this.style;
}
},
hasWillChange: {
type: Boolean,
value: function () {
return 'willChange' in this.style;
}
},
narrow: {
reflectToAttribute: true,
type: Boolean,
value: false,
readOnly: true,
notify: true
},
peeking: {
type: Boolean,
value: false,
readOnly: true,
notify: true
},
responsiveWidth: {
type: String,
value: '640px'
},
rightDrawer: {
type: Boolean,
value: false
},
selected: {
reflectToAttribute: true,
notify: true,
type: String,
value: null
},
drawerToggleAttribute: {
type: String,
value: 'paper-drawer-toggle'
},
transition: {
type: Boolean,
value: false
}
},
listeners: {
tap: '_onTap',
track: '_onTrack',
down: '_downHandler',
up: '_upHandler'
},
observers: ['_forceNarrowChanged(forceNarrow, defaultSelected)'],
togglePanel: function () {
if (this._isMainSelected()) {
this.openDrawer();
} else {
this.closeDrawer();
}
},
openDrawer: function () {
this.selected = 'drawer';
},
closeDrawer: function () {
this.selected = 'main';
},
ready: function () {
this.transition = true;
},
_computeIronSelectorClass: function (narrow, transition, dragging, rightDrawer, peeking) {
return classNames({
dragging: dragging,
'narrow-layout': narrow,
'right-drawer': rightDrawer,
'left-drawer': !rightDrawer,
transition: transition,
peeking: peeking
});
},
_computeDrawerStyle: function (drawerWidth) {
return 'width:' + drawerWidth + ';';
},
_computeMainStyle: function (narrow, rightDrawer, drawerWidth) {
var style = '';
style += 'left:' + (narrow || rightDrawer ? '0' : drawerWidth) + ';';
if (rightDrawer) {
style += 'right:' + (narrow ? '' : drawerWidth) + ';';
}
return style;
},
_computeMediaQuery: function (forceNarrow, responsiveWidth) {
return forceNarrow ? '' : '(max-width: ' + responsiveWidth + ')';
},
_computeSwipeOverlayHidden: function (narrow, disableEdgeSwipe) {
return !narrow || disableEdgeSwipe;
},
_onTrack: function (event) {
if (sharedPanel && this !== sharedPanel) {
return;
}
switch (event.detail.state) {
case 'start':
this._trackStart(event);
break;
case 'track':
this._trackX(event);
break;
case 'end':
this._trackEnd(event);
break;
}
},
_responsiveChange: function (narrow) {
this._setNarrow(narrow);
if (this.narrow) {
this.selected = this.defaultSelected;
}
this.setScrollDirection(this._swipeAllowed() ? 'y' : 'all');
this.fire('paper-responsive-change', { narrow: this.narrow });
},
_onQueryMatchesChanged: function (event) {
this._responsiveChange(event.detail.value);
},
_forceNarrowChanged: function () {
this._responsiveChange(this.forceNarrow || this.$.mq.queryMatches);
},
_swipeAllowed: function () {
return this.narrow && !this.disableSwipe;
},
_isMainSelected: function () {
return this.selected === 'main';
},
_startEdgePeek: function () {
this.width = this.$.drawer.offsetWidth;
this._moveDrawer(this._translateXForDeltaX(this.rightDrawer ? -this.edgeSwipeSensitivity : this.edgeSwipeSensitivity));
this._setPeeking(true);
},
_stopEdgePeek: function () {
if (this.peeking) {
this._setPeeking(false);
this._moveDrawer(null);
}
},
_downHandler: function (event) {
if (!this.dragging && this._isMainSelected() && this._isEdgeTouch(event) && !sharedPanel) {
this._startEdgePeek();
event.preventDefault();
sharedPanel = this;
}
},
_upHandler: function () {
this._stopEdgePeek();
sharedPanel = null;
},
_onTap: function (event) {
var targetElement = Polymer.dom(event).localTarget;
var isTargetToggleElement = targetElement && this.drawerToggleAttribute && targetElement.hasAttribute(this.drawerToggleAttribute);
if (isTargetToggleElement) {
this.togglePanel();
}
},
_isEdgeTouch: function (event) {
var x = event.detail.x;
return !this.disableEdgeSwipe && this._swipeAllowed() && (this.rightDrawer ? x >= this.offsetWidth - this.edgeSwipeSensitivity : x <= this.edgeSwipeSensitivity);
},
_trackStart: function (event) {
if (this._swipeAllowed()) {
sharedPanel = this;
this._setDragging(true);
if (this._isMainSelected()) {
this._setDragging(this.peeking || this._isEdgeTouch(event));
}
if (this.dragging) {
this.width = this.$.drawer.offsetWidth;
this.transition = false;
}
}
},
_translateXForDeltaX: function (deltaX) {
var isMain = this._isMainSelected();
if (this.rightDrawer) {
return Math.max(0, isMain ? this.width + deltaX : deltaX);
} else {
return Math.min(0, isMain ? deltaX - this.width : deltaX);
}
},
_trackX: function (event) {
if (this.dragging) {
var dx = event.detail.dx;
if (this.peeking) {
if (Math.abs(dx) <= this.edgeSwipeSensitivity) {
return;
}
this._setPeeking(false);
}
this._moveDrawer(this._translateXForDeltaX(dx));
}
},
_trackEnd: function (event) {
if (this.dragging) {
var xDirection = event.detail.dx > 0;
this._setDragging(false);
this.transition = true;
sharedPanel = null;
this._moveDrawer(null);
if (this.rightDrawer) {
this[xDirection ? 'closeDrawer' : 'openDrawer']();
} else {
this[xDirection ? 'openDrawer' : 'closeDrawer']();
}
}
},
_transformForTranslateX: function (translateX) {
if (translateX === null) {
return '';
}
return this.hasWillChange ? 'translateX(' + translateX + 'px)' : 'translate3d(' + translateX + 'px, 0, 0)';
},
_moveDrawer: function (translateX) {
this.transform(this._transformForTranslateX(translateX), this.$.drawer);
}
});
}());
;(function () {
'use strict';
function classNames(obj) {
var classNames = [];
for (var key in obj) {
if (obj.hasOwnProperty(key) && obj[key]) {
classNames.push(key);
}
}
return classNames.join(' ');
}
Polymer({
is: 'paper-toolbar',
hostAttributes: { 'role': 'toolbar' },
properties: {
bottomJustify: {
type: String,
value: ''
},
justify: {
type: String,
value: ''
},
middleJustify: {
type: String,
value: ''
}
},
attached: function () {
this._observer = this._observe(this);
this._updateAriaLabelledBy();
},
detached: function () {
if (this._observer) {
this._observer.disconnect();
}
},
_observe: function (node) {
var observer = new MutationObserver(function () {
this._updateAriaLabelledBy();
}.bind(this));
observer.observe(node, {
childList: true,
subtree: true
});
return observer;
},
_updateAriaLabelledBy: function () {
var labelledBy = [];
var contents = Polymer.dom(this.root).querySelectorAll('content');
for (var content, index = 0; content = contents[index]; index++) {
var nodes = Polymer.dom(content).getDistributedNodes();
for (var node, jndex = 0; node = nodes[jndex]; jndex++) {
if (node.classList && node.classList.contains('title')) {
if (node.id) {
labelledBy.push(node.id);
} else {
var id = 'paper-toolbar-label-' + Math.floor(Math.random() * 10000);
node.id = id;
labelledBy.push(id);
}
}
}
}
if (labelledBy.length > 0) {
this.setAttribute('aria-labelledby', labelledBy.join(' '));
}
},
_computeBarClassName: function (barJustify) {
var classObj = {
'center': true,
'horizontal': true,
'layout': true,
'toolbar-tools': true
};
if (barJustify) {
var justifyClassName = barJustify === 'justified' ? barJustify : barJustify + '-justified';
classObj[justifyClassName] = true;
}
return classNames(classObj);
}
});
}());
;(function () {
Polymer({
is: 'paper-item',
hostAttributes: { role: 'listitem' }
});
}());
;(function () {
Polymer({ is: 'paper-item-body' });
}());
;(function () {
Polymer({
is: 'paper-menu',
behaviors: [Polymer.IronMenuBehavior]
});
}());
;Polymer({
is: 'iron-icon',
properties: {
icon: {
type: String,
observer: '_iconChanged'
},
theme: {
type: String,
observer: '_updateIcon'
},
src: {
type: String,
observer: '_srcChanged'
},
_meta: { value: Polymer.Base.create('iron-meta', { type: 'iconset' }) }
},
_DEFAULT_ICONSET: 'icons',
_iconChanged: function (icon) {
var parts = (icon || '').split(':');
this._iconName = parts.pop();
this._iconsetName = parts.pop() || this._DEFAULT_ICONSET;
this._updateIcon();
},
_srcChanged: function (src) {
this._updateIcon();
},
_usesIconset: function () {
return this.icon || !this.src;
},
_updateIcon: function () {
if (this._usesIconset()) {
if (this._iconsetName) {
this._iconset = this._meta.byKey(this._iconsetName);
if (this._iconset) {
this._iconset.applyIcon(this, this._iconName, this.theme);
} else {
this._warn(this._logf('_updateIcon', 'could not find iconset `' + this._iconsetName + '`, did you import the iconset?'));
}
}
} else {
if (!this._img) {
this._img = document.createElement('img');
this._img.style.width = '100%';
this._img.style.height = '100%';
this._img.draggable = false;
}
this._img.src = this.src;
Polymer.dom(this.root).appendChild(this._img);
}
}
});
;Polymer({
is: 'paper-badge',
behaviors: [Polymer.IronResizableBehavior],
listeners: { 'iron-resize': 'updatePosition' },
properties: {
for: {
type: String,
observer: '_forChanged'
},
label: { type: String }
},
attached: function () {
this._updateTarget();
},
_forChanged: function () {
if (!this.isAttached) {
return;
}
this._updateTarget();
},
_updateTarget: function () {
this._target = this.target;
this.async(this.notifyResize, 1);
},
get target() {
var parentNode = Polymer.dom(this).parentNode;
var ownerRoot = Polymer.dom(this).getOwnerRoot();
var target;
if (this.for) {
target = Polymer.dom(ownerRoot).querySelector('#' + this.for);
} else {
target = parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE ? ownerRoot.host : parentNode;
}
return target;
},
updatePosition: function () {
if (!this._target)
return;
if (!this.offsetParent)
return;
var parentRect = this.offsetParent.getBoundingClientRect();
var targetRect = this._target.getBoundingClientRect();
var thisRect = this.getBoundingClientRect();
this.style.left = targetRect.left - parentRect.left + (targetRect.width - thisRect.width / 2) + 'px';
this.style.top = targetRect.top - parentRect.top - thisRect.height / 2 + 'px';
}
});
;Polymer({
is: 'chat-thread-list',
properties: {
user: Object,
threads: {
type: Array,
observer: '_threadsChanged'
},
_selectedIndex: { observer: '_selectedIndexChanged' },
selectedThread: { notify: true }
},
_threadsChanged: function () {
this._selectedIndex = 0;
},
_selectedIndexChanged: function (idx) {
this.$.selector.select(this.threads[idx]);
},
_computeUnreadCount: function (lastReadMessageInfo, threadsInfo) {
return threadsInfo.base.reduce(function (prev, thread) {
return prev + (lastReadMessageInfo.base[thread.id] == thread.messages.length ? 0 : 1);
}, 0);
},
_computeThreadRead: function (length, id, lastReadMessageInfo) {
return length == lastReadMessageInfo.base[id];
}
});
;(function () {
var Utility = {
distance: function (x1, y1, x2, y2) {
var xDelta = x1 - x2;
var yDelta = y1 - y2;
return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
},
now: window.performance && window.performance.now ? window.performance.now.bind(window.performance) : Date.now
};
function ElementMetrics(element) {
this.element = element;
this.width = this.boundingRect.width;
this.height = this.boundingRect.height;
this.size = Math.max(this.width, this.height);
}
ElementMetrics.prototype = {
get boundingRect() {
return this.element.getBoundingClientRect();
},
furthestCornerDistanceFrom: function (x, y) {
var topLeft = Utility.distance(x, y, 0, 0);
var topRight = Utility.distance(x, y, this.width, 0);
var bottomLeft = Utility.distance(x, y, 0, this.height);
var bottomRight = Utility.distance(x, y, this.width, this.height);
return Math.max(topLeft, topRight, bottomLeft, bottomRight);
}
};
function Ripple(element) {
this.element = element;
this.color = window.getComputedStyle(element).color;
this.wave = document.createElement('div');
this.waveContainer = document.createElement('div');
this.wave.style.backgroundColor = this.color;
this.wave.classList.add('wave');
this.waveContainer.classList.add('wave-container');
Polymer.dom(this.waveContainer).appendChild(this.wave);
this.resetInteractionState();
}
Ripple.MAX_RADIUS = 300;
Ripple.prototype = {
get recenters() {
return this.element.recenters;
},
get center() {
return this.element.center;
},
get mouseDownElapsed() {
var elapsed;
if (!this.mouseDownStart) {
return 0;
}
elapsed = Utility.now() - this.mouseDownStart;
if (this.mouseUpStart) {
elapsed -= this.mouseUpElapsed;
}
return elapsed;
},
get mouseUpElapsed() {
return this.mouseUpStart ? Utility.now() - this.mouseUpStart : 0;
},
get mouseDownElapsedSeconds() {
return this.mouseDownElapsed / 1000;
},
get mouseUpElapsedSeconds() {
return this.mouseUpElapsed / 1000;
},
get mouseInteractionSeconds() {
return this.mouseDownElapsedSeconds + this.mouseUpElapsedSeconds;
},
get initialOpacity() {
return this.element.initialOpacity;
},
get opacityDecayVelocity() {
return this.element.opacityDecayVelocity;
},
get radius() {
var width2 = this.containerMetrics.width * this.containerMetrics.width;
var height2 = this.containerMetrics.height * this.containerMetrics.height;
var waveRadius = Math.min(Math.sqrt(width2 + height2), Ripple.MAX_RADIUS) * 1.1 + 5;
var duration = 1.1 - 0.2 * (waveRadius / Ripple.MAX_RADIUS);
var timeNow = this.mouseInteractionSeconds / duration;
var size = waveRadius * (1 - Math.pow(80, -timeNow));
return Math.abs(size);
},
get opacity() {
if (!this.mouseUpStart) {
return this.initialOpacity;
}
return Math.max(0, this.initialOpacity - this.mouseUpElapsedSeconds * this.opacityDecayVelocity);
},
get outerOpacity() {
var outerOpacity = this.mouseUpElapsedSeconds * 0.3;
var waveOpacity = this.opacity;
return Math.max(0, Math.min(outerOpacity, waveOpacity));
},
get isOpacityFullyDecayed() {
return this.opacity < 0.01 && this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
},
get isRestingAtMaxRadius() {
return this.opacity >= this.initialOpacity && this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
},
get isAnimationComplete() {
return this.mouseUpStart ? this.isOpacityFullyDecayed : this.isRestingAtMaxRadius;
},
get translationFraction() {
return Math.min(1, this.radius / this.containerMetrics.size * 2 / Math.sqrt(2));
},
get xNow() {
if (this.xEnd) {
return this.xStart + this.translationFraction * (this.xEnd - this.xStart);
}
return this.xStart;
},
get yNow() {
if (this.yEnd) {
return this.yStart + this.translationFraction * (this.yEnd - this.yStart);
}
return this.yStart;
},
get isMouseDown() {
return this.mouseDownStart && !this.mouseUpStart;
},
resetInteractionState: function () {
this.maxRadius = 0;
this.mouseDownStart = 0;
this.mouseUpStart = 0;
this.xStart = 0;
this.yStart = 0;
this.xEnd = 0;
this.yEnd = 0;
this.slideDistance = 0;
this.containerMetrics = new ElementMetrics(this.element);
},
draw: function () {
var scale;
var translateString;
var dx;
var dy;
this.wave.style.opacity = this.opacity;
scale = this.radius / (this.containerMetrics.size / 2);
dx = this.xNow - this.containerMetrics.width / 2;
dy = this.yNow - this.containerMetrics.height / 2;
this.waveContainer.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';
this.waveContainer.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
this.wave.style.webkitTransform = 'scale(' + scale + ',' + scale + ')';
this.wave.style.transform = 'scale3d(' + scale + ',' + scale + ',1)';
},
downAction: function (event) {
var xCenter = this.containerMetrics.width / 2;
var yCenter = this.containerMetrics.height / 2;
this.resetInteractionState();
this.mouseDownStart = Utility.now();
if (this.center) {
this.xStart = xCenter;
this.yStart = yCenter;
this.slideDistance = Utility.distance(this.xStart, this.yStart, this.xEnd, this.yEnd);
} else {
this.xStart = event ? event.detail.x - this.containerMetrics.boundingRect.left : this.containerMetrics.width / 2;
this.yStart = event ? event.detail.y - this.containerMetrics.boundingRect.top : this.containerMetrics.height / 2;
}
if (this.recenters) {
this.xEnd = xCenter;
this.yEnd = yCenter;
this.slideDistance = Utility.distance(this.xStart, this.yStart, this.xEnd, this.yEnd);
}
this.maxRadius = this.containerMetrics.furthestCornerDistanceFrom(this.xStart, this.yStart);
this.waveContainer.style.top = (this.containerMetrics.height - this.containerMetrics.size) / 2 + 'px';
this.waveContainer.style.left = (this.containerMetrics.width - this.containerMetrics.size) / 2 + 'px';
this.waveContainer.style.width = this.containerMetrics.size + 'px';
this.waveContainer.style.height = this.containerMetrics.size + 'px';
},
upAction: function (event) {
if (!this.isMouseDown) {
return;
}
this.mouseUpStart = Utility.now();
},
remove: function () {
Polymer.dom(this.waveContainer.parentNode).removeChild(this.waveContainer);
}
};
Polymer({
is: 'paper-ripple',
behaviors: [Polymer.IronA11yKeysBehavior],
properties: {
initialOpacity: {
type: Number,
value: 0.25
},
opacityDecayVelocity: {
type: Number,
value: 0.8
},
recenters: {
type: Boolean,
value: false
},
center: {
type: Boolean,
value: false
},
ripples: {
type: Array,
value: function () {
return [];
}
},
animating: {
type: Boolean,
readOnly: true,
reflectToAttribute: true,
value: false
},
holdDown: {
type: Boolean,
value: false,
observer: '_holdDownChanged'
},
_animating: { type: Boolean },
_boundAnimate: {
type: Function,
value: function () {
return this.animate.bind(this);
}
}
},
get target() {
var ownerRoot = Polymer.dom(this).getOwnerRoot();
var target;
if (this.parentNode.nodeType == 11) {
target = ownerRoot.host;
} else {
target = this.parentNode;
}
return target;
},
keyBindings: {
'enter:keydown': '_onEnterKeydown',
'space:keydown': '_onSpaceKeydown',
'space:keyup': '_onSpaceKeyup'
},
attached: function () {
this.listen(this.target, 'up', 'upAction');
this.listen(this.target, 'down', 'downAction');
if (!this.target.hasAttribute('noink')) {
this.keyEventTarget = this.target;
}
},
get shouldKeepAnimating() {
for (var index = 0; index < this.ripples.length; ++index) {
if (!this.ripples[index].isAnimationComplete) {
return true;
}
}
return false;
},
simulatedRipple: function () {
this.downAction(null);
this.async(function () {
this.upAction();
}, 1);
},
downAction: function (event) {
if (this.holdDown && this.ripples.length > 0) {
return;
}
var ripple = this.addRipple();
ripple.downAction(event);
if (!this._animating) {
this.animate();
}
},
upAction: function (event) {
if (this.holdDown) {
return;
}
this.ripples.forEach(function (ripple) {
ripple.upAction(event);
});
this.animate();
},
onAnimationComplete: function () {
this._animating = false;
this.$.background.style.backgroundColor = null;
this.fire('transitionend');
},
addRipple: function () {
var ripple = new Ripple(this);
Polymer.dom(this.$.waves).appendChild(ripple.waveContainer);
this.$.background.style.backgroundColor = ripple.color;
this.ripples.push(ripple);
this._setAnimating(true);
return ripple;
},
removeRipple: function (ripple) {
var rippleIndex = this.ripples.indexOf(ripple);
if (rippleIndex < 0) {
return;
}
this.ripples.splice(rippleIndex, 1);
ripple.remove();
if (!this.ripples.length) {
this._setAnimating(false);
}
},
animate: function () {
var index;
var ripple;
this._animating = true;
for (index = 0; index < this.ripples.length; ++index) {
ripple = this.ripples[index];
ripple.draw();
this.$.background.style.opacity = ripple.outerOpacity;
if (ripple.isOpacityFullyDecayed && !ripple.isRestingAtMaxRadius) {
this.removeRipple(ripple);
}
}
if (!this.shouldKeepAnimating && this.ripples.length === 0) {
this.onAnimationComplete();
} else {
window.requestAnimationFrame(this._boundAnimate);
}
},
_onEnterKeydown: function () {
this.downAction();
this.async(this.upAction, 1);
},
_onSpaceKeydown: function () {
this.downAction();
},
_onSpaceKeyup: function () {
this.upAction();
},
_holdDownChanged: function (holdDown) {
if (holdDown) {
this.downAction();
} else {
this.upAction();
}
}
});
}());
;Polymer({
is: 'paper-icon-button',
hostAttributes: {
role: 'button',
tabindex: '0'
},
behaviors: [Polymer.PaperInkyFocusBehavior],
properties: {
src: { type: String },
icon: { type: String },
alt: {
type: String,
observer: '_altChanged'
}
},
_altChanged: function (newValue, oldValue) {
var label = this.getAttribute('aria-label');
if (!label || oldValue == label) {
this.setAttribute('aria-label', newValue);
}
}
});
;(function () {
Polymer({
is: 'iron-overlay-backdrop',
properties: {
opened: {
readOnly: true,
reflectToAttribute: true,
type: Boolean,
value: false
},
_manager: {
type: Object,
value: Polymer.IronOverlayManager
}
},
prepare: function () {
if (!this.parentNode) {
Polymer.dom(document.body).appendChild(this);
this.style.zIndex = this._manager.currentOverlayZ() - 1;
}
},
open: function () {
if (this._manager.getBackdrops().length < 2) {
this._setOpened(true);
}
},
close: function () {
if (this._manager.getBackdrops().length < 2) {
this._setOpened(false);
}
},
complete: function () {
if (this._manager.getBackdrops().length === 0 && this.parentNode) {
Polymer.dom(this.parentNode).removeChild(this);
}
}
});
}());
;(function () {
'use strict';
Polymer({
is: 'iron-dropdown',
behaviors: [
Polymer.IronControlState,
Polymer.IronA11yKeysBehavior,
Polymer.IronOverlayBehavior,
Polymer.NeonAnimationRunnerBehavior
],
properties: {
horizontalAlign: {
type: String,
value: 'left',
reflectToAttribute: true
},
verticalAlign: {
type: String,
value: 'top',
reflectToAttribute: true
},
horizontalOffset: {
type: Number,
value: 0,
notify: true
},
verticalOffset: {
type: Number,
value: 0,
notify: true
},
positionTarget: {
type: Object,
observer: '_positionTargetChanged'
},
openAnimationConfig: { type: Object },
closeAnimationConfig: { type: Object },
focusTarget: { type: Object },
noAnimations: {
type: Boolean,
value: false
},
_positionRectMemo: { type: Object }
},
listeners: { 'neon-animation-finish': '_onNeonAnimationFinish' },
observers: ['_updateOverlayPosition(verticalAlign, horizontalAlign, verticalOffset, horizontalOffset)'],
attached: function () {
if (this.positionTarget === undefined) {
this.positionTarget = this._defaultPositionTarget;
}
},
get containedElement() {
return Polymer.dom(this.$.content).getDistributedNodes()[0];
},
get _focusTarget() {
return this.focusTarget || this.containedElement;
},
get _defaultPositionTarget() {
var parent = Polymer.dom(this).parentNode;
if (parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
parent = parent.host;
}
return parent;
},
get _positionRect() {
if (!this._positionRectMemo && this.positionTarget) {
this._positionRectMemo = this.positionTarget.getBoundingClientRect();
}
return this._positionRectMemo;
},
get _horizontalAlignTargetValue() {
var target;
if (this.horizontalAlign === 'right') {
target = document.documentElement.clientWidth - this._positionRect.right;
} else {
target = this._positionRect.left;
}
target += this.horizontalOffset;
return Math.max(target, 0);
},
get _verticalAlignTargetValue() {
var target;
if (this.verticalAlign === 'bottom') {
target = document.documentElement.clientHeight - this._positionRect.bottom;
} else {
target = this._positionRect.top;
}
target += this.verticalOffset;
return Math.max(target, 0);
},
_openedChanged: function (opened) {
if (opened && this.disabled) {
this.cancel();
} else {
this.cancelAnimation();
this._prepareDropdown();
Polymer.IronOverlayBehaviorImpl._openedChanged.apply(this, arguments);
}
if (this.opened) {
this._focusContent();
}
},
_renderOpened: function () {
Polymer.IronDropdownScrollManager.pushScrollLock(this);
if (!this.noAnimations && this.animationConfig && this.animationConfig.open) {
this.$.contentWrapper.classList.add('animating');
this.playAnimation('open');
} else {
Polymer.IronOverlayBehaviorImpl._renderOpened.apply(this, arguments);
}
},
_renderClosed: function () {
Polymer.IronDropdownScrollManager.removeScrollLock(this);
if (!this.noAnimations && this.animationConfig && this.animationConfig.close) {
this.$.contentWrapper.classList.add('animating');
this.playAnimation('close');
} else {
Polymer.IronOverlayBehaviorImpl._renderClosed.apply(this, arguments);
}
},
_onNeonAnimationFinish: function () {
this.$.contentWrapper.classList.remove('animating');
if (this.opened) {
Polymer.IronOverlayBehaviorImpl._renderOpened.apply(this);
} else {
Polymer.IronOverlayBehaviorImpl._renderClosed.apply(this);
}
},
_onIronResize: function () {
var containedElement = this.containedElement;
var scrollTop;
var scrollLeft;
if (containedElement) {
scrollTop = containedElement.scrollTop;
scrollLeft = containedElement.scrollLeft;
}
if (this.opened) {
this._updateOverlayPosition();
}
Polymer.IronOverlayBehaviorImpl._onIronResize.apply(this, arguments);
if (containedElement) {
containedElement.scrollTop = scrollTop;
containedElement.scrollLeft = scrollLeft;
}
},
_positionTargetChanged: function () {
this._updateOverlayPosition();
},
_updateAnimationConfig: function () {
var animationConfig = {};
var animations = [];
if (this.openAnimationConfig) {
animationConfig.open = [{ name: 'opaque-animation' }].concat(this.openAnimationConfig);
animations = animations.concat(animationConfig.open);
}
if (this.closeAnimationConfig) {
animationConfig.close = this.closeAnimationConfig;
animations = animations.concat(animationConfig.close);
}
animations.forEach(function (animation) {
animation.node = this.containedElement;
}, this);
this.animationConfig = animationConfig;
},
_prepareDropdown: function () {
this.sizingTarget = this.containedElement || this.sizingTarget;
this._updateAnimationConfig();
this._updateOverlayPosition();
},
_updateOverlayPosition: function () {
this._positionRectMemo = null;
if (!this.positionTarget) {
return;
}
this.style[this.horizontalAlign] = this._horizontalAlignTargetValue + 'px';
this.style[this.verticalAlign] = this._verticalAlignTargetValue + 'px';
if (this._fitInfo) {
this._fitInfo.inlineStyle[this.horizontalAlign] = this.style[this.horizontalAlign];
this._fitInfo.inlineStyle[this.verticalAlign] = this.style[this.verticalAlign];
}
},
_focusContent: function () {
this.async(function () {
if (this._focusTarget) {
this._focusTarget.focus();
}
});
}
});
}());
;Polymer({
is: 'paper-material',
properties: {
elevation: {
type: Number,
reflectToAttribute: true,
value: 1
},
animated: {
type: Boolean,
reflectToAttribute: true,
value: false
}
}
});
;(function () {
'use strict';
var PaperMenuButton = Polymer({
is: 'paper-menu-button',
behaviors: [
Polymer.IronA11yKeysBehavior,
Polymer.IronControlState
],
properties: {
opened: {
type: Boolean,
value: false,
notify: true,
observer: '_openedChanged'
},
horizontalAlign: {
type: String,
value: 'left',
reflectToAttribute: true
},
verticalAlign: {
type: String,
value: 'top',
reflectToAttribute: true
},
horizontalOffset: {
type: Number,
value: 0,
notify: true
},
verticalOffset: {
type: Number,
value: 0,
notify: true
},
noAnimations: {
type: Boolean,
value: false
},
ignoreSelect: {
type: Boolean,
value: false
},
openAnimationConfig: {
type: Object,
value: function () {
return [
{
name: 'fade-in-animation',
timing: {
delay: 100,
duration: 200
}
},
{
name: 'paper-menu-grow-width-animation',
timing: {
delay: 100,
duration: 150,
easing: PaperMenuButton.ANIMATION_CUBIC_BEZIER
}
},
{
name: 'paper-menu-grow-height-animation',
timing: {
delay: 100,
duration: 275,
easing: PaperMenuButton.ANIMATION_CUBIC_BEZIER
}
}
];
}
},
closeAnimationConfig: {
type: Object,
value: function () {
return [
{
name: 'fade-out-animation',
timing: { duration: 150 }
},
{
name: 'paper-menu-shrink-width-animation',
timing: {
delay: 100,
duration: 50,
easing: PaperMenuButton.ANIMATION_CUBIC_BEZIER
}
},
{
name: 'paper-menu-shrink-height-animation',
timing: {
duration: 200,
easing: 'ease-in'
}
}
];
}
},
_dropdownContent: { type: Object }
},
hostAttributes: {
role: 'group',
'aria-haspopup': 'true'
},
listeners: { 'iron-select': '_onIronSelect' },
get contentElement() {
return Polymer.dom(this.$.content).getDistributedNodes()[0];
},
open: function () {
if (this.disabled) {
return;
}
this.$.dropdown.open();
},
close: function () {
this.$.dropdown.close();
},
_onIronSelect: function (event) {
if (!this.ignoreSelect) {
this.close();
}
},
_openedChanged: function (opened, oldOpened) {
if (opened) {
this._dropdownContent = this.contentElement;
this.fire('paper-dropdown-open');
} else if (oldOpened != null) {
this.fire('paper-dropdown-close');
}
},
_disabledChanged: function (disabled) {
Polymer.IronControlState._disabledChanged.apply(this, arguments);
if (disabled && this.opened) {
this.close();
}
}
});
PaperMenuButton.ANIMATION_CUBIC_BEZIER = 'cubic-bezier(.3,.95,.5,1)';
PaperMenuButton.MAX_ANIMATION_TIME_MS = 400;
Polymer.PaperMenuButton = PaperMenuButton;
}());
;Polymer({
is: 'paper-input-container',
properties: {
noLabelFloat: {
type: Boolean,
value: false
},
alwaysFloatLabel: {
type: Boolean,
value: false
},
attrForValue: {
type: String,
value: 'bind-value'
},
autoValidate: {
type: Boolean,
value: false
},
invalid: {
observer: '_invalidChanged',
type: Boolean,
value: false
},
focused: {
readOnly: true,
type: Boolean,
value: false,
notify: true
},
_addons: { type: Array },
_inputHasContent: {
type: Boolean,
value: false
},
_inputSelector: {
type: String,
value: 'input,textarea,.paper-input-input'
},
_boundOnFocus: {
type: Function,
value: function () {
return this._onFocus.bind(this);
}
},
_boundOnBlur: {
type: Function,
value: function () {
return this._onBlur.bind(this);
}
},
_boundOnInput: {
type: Function,
value: function () {
return this._onInput.bind(this);
}
},
_boundValueChanged: {
type: Function,
value: function () {
return this._onValueChanged.bind(this);
}
}
},
listeners: {
'addon-attached': '_onAddonAttached',
'iron-input-validate': '_onIronInputValidate'
},
get _valueChangedEvent() {
return this.attrForValue + '-changed';
},
get _propertyForValue() {
return Polymer.CaseMap.dashToCamelCase(this.attrForValue);
},
get _inputElement() {
return Polymer.dom(this).querySelector(this._inputSelector);
},
get _inputElementValue() {
return this._inputElement[this._propertyForValue] || this._inputElement.value;
},
ready: function () {
if (!this._addons) {
this._addons = [];
}
this.addEventListener('focus', this._boundOnFocus, true);
this.addEventListener('blur', this._boundOnBlur, true);
if (this.attrForValue) {
this._inputElement.addEventListener(this._valueChangedEvent, this._boundValueChanged);
} else {
this.addEventListener('input', this._onInput);
}
},
attached: function () {
if (this._inputElementValue != '') {
this._handleValueAndAutoValidate(this._inputElement);
} else {
this._handleValue(this._inputElement);
}
},
_onAddonAttached: function (event) {
if (!this._addons) {
this._addons = [];
}
var target = event.target;
if (this._addons.indexOf(target) === -1) {
this._addons.push(target);
if (this.isAttached) {
this._handleValue(this._inputElement);
}
}
},
_onFocus: function () {
this._setFocused(true);
},
_onBlur: function () {
this._setFocused(false);
this._handleValueAndAutoValidate(this._inputElement);
},
_onInput: function (event) {
this._handleValueAndAutoValidate(event.target);
},
_onValueChanged: function (event) {
this._handleValueAndAutoValidate(event.target);
},
_handleValue: function (inputElement) {
var value = this._inputElementValue;
if (value || value === 0 || inputElement.type === 'number' && !inputElement.checkValidity()) {
this._inputHasContent = true;
} else {
this._inputHasContent = false;
}
this.updateAddons({
inputElement: inputElement,
value: value,
invalid: this.invalid
});
},
_handleValueAndAutoValidate: function (inputElement) {
if (this.autoValidate) {
var valid;
if (inputElement.validate) {
valid = inputElement.validate(this._inputElementValue);
} else {
valid = inputElement.checkValidity();
}
this.invalid = !valid;
}
this._handleValue(inputElement);
},
_onIronInputValidate: function (event) {
this.invalid = this._inputElement.invalid;
},
_invalidChanged: function () {
if (this._addons) {
this.updateAddons({ invalid: this.invalid });
}
},
updateAddons: function (state) {
for (var addon, index = 0; addon = this._addons[index]; index++) {
addon.update(state);
}
},
_computeInputContentClass: function (noLabelFloat, alwaysFloatLabel, focused, invalid, _inputHasContent) {
var cls = 'input-content';
if (!noLabelFloat) {
var label = this.querySelector('label');
if (alwaysFloatLabel || _inputHasContent) {
cls += ' label-is-floating';
if (invalid) {
cls += ' is-invalid';
} else if (focused) {
cls += ' label-is-highlighted';
}
if (this.$.prefix && label && label.offsetParent && Polymer.dom(this.$.prefix).getDistributedNodes().length > 0) {
label.style.left = -label.offsetParent.offsetLeft + 'px';
}
} else {
if (label) {
label.style.left = 0;
}
}
} else {
if (_inputHasContent) {
cls += ' label-is-hidden';
}
}
return cls;
},
_computeUnderlineClass: function (focused, invalid) {
var cls = 'underline';
if (invalid) {
cls += ' is-invalid';
} else if (focused) {
cls += ' is-highlighted';
}
return cls;
},
_computeAddOnContentClass: function (focused, invalid) {
var cls = 'add-on-content';
if (invalid) {
cls += ' is-invalid';
} else if (focused) {
cls += ' is-highlighted';
}
return cls;
}
});
;Polymer({
is: 'paper-input-error',
behaviors: [Polymer.PaperInputAddonBehavior],
properties: {
invalid: {
readOnly: true,
reflectToAttribute: true,
type: Boolean
}
},
update: function (state) {
this._setInvalid(state.invalid);
}
});
;Polymer({
is: 'paper-input-char-counter',
behaviors: [Polymer.PaperInputAddonBehavior],
properties: {
_charCounterStr: {
type: String,
value: '0'
}
},
update: function (state) {
if (!state.inputElement) {
return;
}
state.value = state.value || '';
var str = state.value.replace(/(\r\n|\n|\r)/g, '--').length;
if (state.inputElement.hasAttribute('maxlength')) {
str += '/' + state.inputElement.getAttribute('maxlength');
}
this._charCounterStr = str;
}
});
;Polymer({
is: 'paper-input',
behaviors: [
Polymer.IronFormElementBehavior,
Polymer.PaperInputBehavior,
Polymer.IronControlState
]
});
;Polymer({
is: 'input-header',
properties: {
label: {
type: String,
notify: true
}
}
});
;Polymer({
is: 'chat-thread-view',
properties: {
thread: Object,
user: Object
},
observers: ['_updateLastReadMessage(thread.id, thread.messages.length, user)'],
_updateLastReadMessage: function (id, length, user) {
this.set([
'user.lastReadMessage',
id
], length);
},
_handleInput: function (e) {
if (e.keyCode == 13) {
this.push('thread.messages', {
text: e.target.value,
user: this.user.name
});
this.set('thread.lastMessage', e.target.value);
e.target.value = '';
}
}
});
;Polymer({
is: 'chat-view',
properties: {
user: {
value: function () {
return {
name: 'Kevin',
lastReadMessage: {}
};
}
}
}
});