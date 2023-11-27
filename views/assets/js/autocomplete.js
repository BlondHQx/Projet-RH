(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.autocomplete = factory());
}(this, (function () { 'use strict';
    function autocomplete(settings) {
        var doc = document;
        var container = settings.container || doc.createElement('div');
        container.id = container.id || 'autocomplete-' + uid();
        var containerStyle = container.style;
        var debounceWaitMs = settings.debounceWaitMs || 0;
        var preventSubmit = settings.preventSubmit || false;
        var disableAutoSelect = settings.disableAutoSelect || false;
        var customContainerParent = container.parentElement;
        var items = [];
        var inputValue = '';
        var minLen = 0;
        var showOnFocus = settings.showOnFocus;
        var selected;
        var fetchCounter = 0;
        var debounceTimer;
        var destroyed = false;
        if (settings.minLength !== undefined) {
            minLen = settings.minLength;
        }
        if (!settings.input) {
            throw new Error('input undefined');
        }
        var input = settings.input;
        container.className = 'autocomplete ' + (settings.className || '');
        container.setAttribute('role', 'listbox');
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-controls', container.id);
        input.setAttribute('aria-owns', container.id);
        input.setAttribute('aria-activedescendant', '');
        input.setAttribute('aria-haspopup', 'listbox');
        containerStyle.position = 'absolute';
        function uid() {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
        }
        function detach() {
            var parent = container.parentNode;
            if (parent) {
                parent.removeChild(container);
            }
        }
        function clearDebounceTimer() {
            if (debounceTimer) {
                window.clearTimeout(debounceTimer);
            }
        }
        function attach() {
            if (!container.parentNode) {
                (customContainerParent || doc.body).appendChild(container);
            }
        }
        function containerDisplayed() {
            return !!container.parentNode;
        }
        function clear() {
            fetchCounter++;
            items = [];
            inputValue = '';
            selected = undefined;
            input.setAttribute('aria-activedescendant', '');
            input.setAttribute('aria-expanded', 'false');
            detach();
        }
        function updatePosition() {
            if (!containerDisplayed()) {
                return;
            }
            input.setAttribute('aria-expanded', 'true');
            containerStyle.height = 'auto';
            containerStyle.width = input.offsetWidth + 'px';
            var maxHeight = 0;
            var inputRect;
            function calc() {
                var docEl = doc.documentElement;
                var clientTop = docEl.clientTop || doc.body.clientTop || 0;
                var clientLeft = docEl.clientLeft || doc.body.clientLeft || 0;
                var scrollTop = window.pageYOffset || docEl.scrollTop;
                var scrollLeft = window.pageXOffset || docEl.scrollLeft;
                inputRect = input.getBoundingClientRect();
                var top = inputRect.top + input.offsetHeight + scrollTop - clientTop;
                var left = inputRect.left + scrollLeft - clientLeft;
                containerStyle.top = top + 'px';
                containerStyle.left = left + 'px';
                maxHeight = window.innerHeight - (inputRect.top + input.offsetHeight);
                if (maxHeight < 0) {
                    maxHeight = 0;
                }
                containerStyle.top = top + 'px';
                containerStyle.bottom = '';
                containerStyle.left = left + 'px';
                containerStyle.maxHeight = maxHeight + 'px';
            }
            calc();
            calc();
            if (settings.customize && inputRect) {
                settings.customize(input, inputRect, container, maxHeight);
            }
        }
        function update() {
            container.innerHTML = '';
            input.setAttribute('aria-activedescendant', '');
            var render = function (item, _, __) {
                var itemElement = doc.createElement('div');
                itemElement.textContent = item.label || '';
                return itemElement;
            };
            if (settings.render) {
                render = settings.render;
            }
            var renderGroup = function (groupName, _) {
                var groupDiv = doc.createElement('div');
                groupDiv.textContent = groupName;
                return groupDiv;
            };
            if (settings.renderGroup) {
                renderGroup = settings.renderGroup;
            }
            var fragment = doc.createDocumentFragment();
            var prevGroup = uid();
            items.forEach(function (item, index) {
                if (item.group && item.group !== prevGroup) {
                    prevGroup = item.group;
                    var groupDiv = renderGroup(item.group, inputValue);
                    if (groupDiv) {
                        groupDiv.className += ' group';
                        fragment.appendChild(groupDiv);
                    }
                }
                var div = render(item, inputValue, index);
                if (div) {
                    div.id = container.id + "_" + index;
                    div.setAttribute('role', 'option');
                    div.addEventListener('click', function (ev) {
                        settings.onSelect(item, input);
                        clear();
                        ev.preventDefault();
                        ev.stopPropagation();
                    });
                    if (item === selected) {
                        div.className += ' selected';
                        div.setAttribute('aria-selected', 'true');
                        input.setAttribute('aria-activedescendant', div.id);
                    }
                    fragment.appendChild(div);
                }
            });
            container.appendChild(fragment);
            if (items.length < 1) {
                if (settings.emptyMsg) {
                    var empty = doc.createElement('div');
                    empty.id = container.id + "_" + uid();
                    empty.className = 'empty';
                    empty.textContent = settings.emptyMsg;
                    container.appendChild(empty);
                    input.setAttribute('aria-activedescendant', empty.id);
                }
                else {
                    clear();
                    return;
                }
            }
            attach();
            updatePosition();
            updateScroll();
        }
        function updateIfDisplayed() {
            if (containerDisplayed()) {
                update();
            }
        }
        function resizeEventHandler() {
            updateIfDisplayed();
        }
        function scrollEventHandler(e) {
            if (e.target !== container) {
                updateIfDisplayed();
            }
            else {
                e.preventDefault();
            }
        }
        function inputEventHandler() {
            fetch(0);
        }
        function updateScroll() {
            var elements = container.getElementsByClassName('selected');
            if (elements.length > 0) {
                var element = elements[0];
                var previous = element.previousElementSibling;
                if (previous && previous.className.indexOf('group') !== -1 && !previous.previousElementSibling) {
                    element = previous;
                }
                if (element.offsetTop < container.scrollTop) {
                    container.scrollTop = element.offsetTop;
                }
                else {
                    var selectBottom = element.offsetTop + element.offsetHeight;
                    var containerBottom = container.scrollTop + container.offsetHeight;
                    if (selectBottom > containerBottom) {
                        container.scrollTop += selectBottom - containerBottom;
                    }
                }
            }
        }
        function selectPreviousSuggestion() {
            var index = items.indexOf(selected);
            selected = index === -1
                ? undefined
                : items[(index + items.length - 1) % items.length];
        }
        function selectNextSuggestion() {
            var index = items.indexOf(selected);
            selected = items.length < 1
                ? undefined
                : index === -1
                    ? items[0]
                    : items[(index + 1) % items.length];
        }
        function handleArrowAndEscapeKeys(ev, key) {
            var containerIsDisplayed = containerDisplayed();
            if (key === 'Escape') {
                clear();
            }
            else {
                if (!containerIsDisplayed || items.length < 1) {
                    return;
                }
                key === 'ArrowUp'
                    ? selectPreviousSuggestion()
                    : selectNextSuggestion();
                update();
            }
            ev.preventDefault();
            if (containerIsDisplayed) {
                ev.stopPropagation();
            }
        }
        function handleEnterKey(ev) {
            if (selected) {
                settings.onSelect(selected, input);
                clear();
            }
            if (preventSubmit) {
                ev.preventDefault();
            }
        }
        function keydownEventHandler(ev) {
            var key = ev.key;
            switch (key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'Escape':
                    handleArrowAndEscapeKeys(ev, key);
                    break;
                case 'Enter':
                    handleEnterKey(ev);
                    break;
            }
        }
        function focusEventHandler() {
            if (showOnFocus) {
                fetch(1);
            }
        }
        function fetch(trigger) {
            if (input.value.length >= minLen || trigger === 1) {
                clearDebounceTimer();
                debounceTimer = window.setTimeout(function () { return startFetch(input.value, trigger, input.selectionStart || 0); }, trigger === 0 /* Keyboard */ || trigger === 2 /* Mouse */ ? debounceWaitMs : 0);
            }
            else {
                clear();
            }
        }
        function startFetch(inputText, trigger, cursorPos) {
            if (destroyed)
                return;
            var savedFetchCounter = ++fetchCounter;
            settings.fetch(inputText, function (elements) {
                if (fetchCounter === savedFetchCounter && elements) {
                    items = elements;
                    inputValue = inputText;
                    selected = (items.length < 1 || disableAutoSelect) ? undefined : items[0];
                    update();
                }
            }, trigger, cursorPos);
        }
        function keyupEventHandler(e) {
            if (settings.keyup) {
                settings.keyup({
                    event: e,
                    fetch: function () { return fetch(0 /* Keyboard */); }
                });
                return;
            }
            if (!containerDisplayed() && e.key === 'ArrowDown') {
                fetch(0 /* Keyboard */);
            }
        }
        function clickEventHandler(e) {
            settings.click && settings.click({
                event: e,
                fetch: function () { return fetch(2 /* Mouse */); }
            });
        }
        function blurEventHandler() {
            setTimeout(function () {
                if (doc.activeElement !== input) {
                    clear();
                }
            }, 200);
        }
        function manualFetch() {
            startFetch(input.value, 3 /* Manual */, input.selectionStart || 0);
        }
        container.addEventListener('mousedown', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
        });
        container.addEventListener('focus', function () { return input.focus(); });
        function destroy() {
            input.removeEventListener('focus', focusEventHandler);
            input.removeEventListener('keyup', keyupEventHandler);
            input.removeEventListener('click', clickEventHandler);
            input.removeEventListener('keydown', keydownEventHandler);
            input.removeEventListener('input', inputEventHandler);
            input.removeEventListener('blur', blurEventHandler);
            window.removeEventListener('resize', resizeEventHandler);
            doc.removeEventListener('scroll', scrollEventHandler, true);
            input.removeAttribute('role');
            input.removeAttribute('aria-expanded');
            input.removeAttribute('aria-autocomplete');
            input.removeAttribute('aria-controls');
            input.removeAttribute('aria-activedescendant');
            input.removeAttribute('aria-owns');
            input.removeAttribute('aria-haspopup');
            clearDebounceTimer();
            clear();
            destroyed = true;
        }
        input.addEventListener('keyup', keyupEventHandler);
        input.addEventListener('click', clickEventHandler);
        input.addEventListener('keydown', keydownEventHandler);
        input.addEventListener('input', inputEventHandler);
        input.addEventListener('blur', blurEventHandler);
        input.addEventListener('focus', focusEventHandler);
        window.addEventListener('resize', resizeEventHandler);
        doc.addEventListener('scroll', scrollEventHandler, true);
        return {
            destroy: destroy,
            fetch: manualFetch
        };
    }

    return autocomplete;

})));
