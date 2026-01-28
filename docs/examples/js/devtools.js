import { CUSS2DevToolsClient, getComponentType } from '../../dist/cuss2-devtools.esm.js';

let client = null;
let components = [];
let componentStates = {};
let tenants = {};

// Make functions available globally
window.connect = connect;
window.disconnect = disconnect;
window.refreshState = refreshState;
window.activateBrand = activateBrand;

// Helper functions
function show(element) {
    element?.classList.remove('hidden');
}

function hide(element) {
    element?.classList.add('hidden');
}

function toggleClass(element, className, condition) {
    if (element) {
        if (condition) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }
}

function $(selector, parent = document) {
    return parent.querySelector(selector);
}

function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

function updateConnectionStatus(status) {
    switch(status) {
        case 'connected':
            document.getElementById('connectBtn').disabled = true;
            document.getElementById('disconnectBtn').disabled = false;
            document.getElementById('refreshStateBtn').disabled = false;
            break;
        case 'connecting':
            document.getElementById('connectBtn').disabled = true;
            document.getElementById('disconnectBtn').disabled = true;
            document.getElementById('refreshStateBtn').disabled = true;
            break;
        case 'disconnected':
            document.getElementById('connectBtn').disabled = false;
            document.getElementById('disconnectBtn').disabled = true;
            document.getElementById('refreshStateBtn').disabled = true;
            break;
    }
}

function addLogEntry(type, message, data = null) {
    // Log to console instead of UI
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
}

function createToggle(isPower = false) {
    const template = $('#toggle-template');
    const toggle = template.content.cloneNode(true).firstElementChild;
    if (isPower) {
        toggle.classList.add('power-toggle');
    }
    return toggle;
}

function updateToggleState(toggle, value) {
    toggleClass(toggle, 'active', value);
    toggle.dataset.value = value ? 'true' : 'false';
}

function createKeypadUI(componentId) {
    const template = $('#keypad-template');
    const keypad = template.content.cloneNode(true);
    const container = keypad.firstElementChild;

    // Attach event handlers to all buttons
    const buttons = $$('.keypad-button', container);
    buttons.forEach(button => {
        const key = button.dataset.key;

        button.onmousedown = async () => {
            button.classList.add('active');
            try {
                await client.cmd(componentId, 'keydown', { keyname: key });
                addLogEntry('sent', `Keydown ${key} on keypad #${componentId}`);
            } catch (error) {
                addLogEntry('error', `Keydown failed: ${error.message}`);
            }
        };

        button.onmouseup = async () => {
            button.classList.remove('active');
            try {
                await client.cmd(componentId, 'keyup', { keyname: key });
                addLogEntry('sent', `Keyup ${key} on keypad #${componentId}`);
            } catch (error) {
                addLogEntry('error', `Keyup failed: ${error.message}`);
            }
        };

        button.onmouseleave = () => {
            button.classList.remove('active');
        };
    });

    return container;
}

function updateComponentList() {
    const listEl = $('#componentList');
    const sectionEl = $('#componentsSection');

    if (!components || components.length === 0) {
        hide(sectionEl);
        return;
    }

    show(sectionEl);
    listEl.innerHTML = '';

    const template = $('#component-template');

    components.forEach(component => {
        const id = component.componentID;
        const state = componentStates[id];

        // Clone template
        const item = template.content.cloneNode(true);
        const itemEl = item.firstElementChild;
        itemEl.dataset.componentId = id;

        // Set component name and ID
        const nameEl = $('.component-name strong', itemEl);
        const idEl = $('.component-id', itemEl);
        nameEl.textContent = component.name;
        nameEl.style.fontSize = '1.1rem';
        nameEl.style.fontWeight = '700';
        nameEl.title = component.name; // Show full name on hover
        idEl.textContent = `#${id}`;

        // Add power toggle if needed
        const headerLeft = $('.component-header-left', itemEl);
        if (component.actions && 'power' in component.actions) {
            const powerWrapper = document.createElement('div');
            powerWrapper.className = 'power-toggle-wrapper';

            const powerToggle = createToggle(true);
            powerToggle.id = `power-${id}`;
            powerToggle.dataset.componentId = id;
            updateToggleState(powerToggle, state?.power);

            powerToggle.onclick = async () => {
                const newValue = powerToggle.dataset.value !== 'true';
                const originalValue = powerToggle.dataset.value === 'true';

                // Optimistically update UI
                updateToggleState(powerToggle, newValue);

                try {
                    const response = await client.cmd(id, 'power', { on: newValue });
                    addLogEntry('sent', `Power ${newValue ? 'on' : 'off'} for component #${id} - OK`);

                    // Update local state since command succeeded
                    if (!componentStates[id]) componentStates[id] = {};
                    componentStates[id].power = newValue;

                    // Request fresh state to ensure UI is in sync
                    setTimeout(() => refreshState(), 100);
                } catch (error) {
                    // Revert on error
                    updateToggleState(powerToggle, originalValue);
                    addLogEntry('error', `Power command failed for component #${id}: ${error.message}`);
                }
            };

            powerWrapper.appendChild(powerToggle);
            headerLeft.insertBefore(powerWrapper, headerLeft.firstChild);
        }

        // Update badges
        const enabledBadge = $('.state-enabled', itemEl);
        enabledBadge.id = `enable-${id}`;
        toggleClass(enabledBadge, 'enabled', state?.enabled);
        toggleClass(enabledBadge, 'disabled', !state?.enabled);
        enabledBadge.textContent = state?.enabled ? 'Enabled' : 'Disabled';

        // Status badge - always show if component has a status
        const statusBadge = $('.state-status', itemEl);
        statusBadge.id = `status-${id}`;
        if (state?.status) {
            toggleClass(statusBadge, 'ok', state.status === 'OK');
            statusBadge.textContent = state.status;
            show(statusBadge);
        } else {
            // Default status if not in state
            statusBadge.textContent = 'UNKNOWN';
            show(statusBadge);
        }

        // Type badge
        const typeBadge = $('.component-type', itemEl);
        typeBadge.textContent = component.type;

        // Component state
        const stateContainer = $('.component-state', itemEl);
        stateContainer.id = `state-${id}`;
        updateComponentState(id, stateContainer);
        if (stateContainer.innerHTML && stateContainer.innerHTML.trim() !== '') {
            show(stateContainer);
        }

        // Component actions
        const actionsContainer = $('.component-actions', itemEl);
        const noActionsEl = $('.no-actions', itemEl);

        // Check if this is a keypad component
        if (component.type === 'KEYPAD') {
            // Use special keypad UI
            const keypadUI = createKeypadUI(id);
            actionsContainer.appendChild(keypadUI);
            hide(noActionsEl);
        } else if (component.actions) {
            let hasActions = false;

            Object.entries(component.actions).forEach(([actionName, params]) => {
                // Skip power action since it's in the header
                if (actionName === 'power') return;

                const actionRow = createActionRow(id, actionName, params);
                actionsContainer.appendChild(actionRow);
                hasActions = true;
            });

            if (!hasActions) {
                show(noActionsEl);
            }
        } else {
            show(noActionsEl);
        }

        listEl.appendChild(itemEl);
    });
}

function updateComponentState(componentId, container) {
    const state = componentStates[componentId];

    if (!state) {
        container.innerHTML = '<span style="color: #666;">No state data</span>';
        return;
    }

    let stateHtml = '';
    Object.entries(state).forEach(([key, value]) => {
        // Skip enabled, status, power, and all boolean values (shown as toggles)
        if (key === 'enabled' || key === 'status' || key === 'power' || typeof value === 'boolean') {
            return;
        }

        let className = 'state-item';

        // Format the display for non-boolean values only
        const displayKey = key.replace(/_/g, ' ');
        stateHtml += `<span class="${className}">${displayKey}: ${value}</span>`;
    });

    if (stateHtml === '') {
        container.innerHTML = '';  // No additional state to show
    } else {
        container.innerHTML = stateHtml;
    }
}

async function refreshState() {
    if (!client || !client.isConnected()) {
        addLogEntry('error', 'Not connected');
        return;
    }

    const refreshBtn = $('#refreshStateBtn');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
        const response = await client.sendWithResponse({ action: 'state' });
        addLogEntry('sent', 'Requested component states - OK');

        // Handle state response
        if (response.state) {
            componentStates = response.state;
            Object.keys(componentStates).forEach(id => {
                updateComponentUI(id);
            });
        }
    } catch (error) {
        addLogEntry('error', `Failed to get state: ${error.message}`);
    } finally {
        if (refreshBtn) refreshBtn.disabled = false;
    }
}

async function fetchTenants() {
    if (!client || !client.isConnected()) {
        addLogEntry('error', 'Not connected');
        return;
    }

    try {
        tenants = await client.listTenants();
        addLogEntry('sent', 'Requested tenant list - OK');
        updateTenantButtons();
    } catch (error) {
        addLogEntry('error', `Failed to get tenants: ${error.message}`);
    }
}

async function activateBrand(tenant, brand) {
    if (!client || !client.isConnected()) {
        addLogEntry('error', 'Not connected');
        return;
    }

    try {
        await client.activateBrand(tenant, brand);
        addLogEntry('sent', `Activated tenant: ${tenant}, brand: ${brand} - OK`);

        // Refresh tenants list to update states
        setTimeout(() => fetchTenants(), 500);
    } catch (error) {
        addLogEntry('error', `Failed to activate brand: ${error.message}`);
    }
}

function updateTenantButtons() {
    const container = $('#tenantButtons');
    const controlsEl = $('#tenantControls');

    if (!container || !controlsEl) return;

    // Clear existing buttons
    container.innerHTML = '';

    // Check if we have any tenants
    if (!tenants || Object.keys(tenants).length === 0) {
        hide(controlsEl);
        return;
    }

    show(controlsEl);

    // Create buttons for each tenant/brand combination
    Object.entries(tenants).forEach(([tenantId, brands]) => {
        Object.entries(brands).forEach(([brandId, state]) => {
            const button = document.createElement('button');
            button.className = 'tenant-button';

            // Add state-specific class for styling
            const stateClass = `state-${state.toLowerCase()}`;
            button.classList.add(stateClass);

            // Only AVAILABLE state should be clickable
            if (state === 'AVAILABLE') {
                button.onclick = () => activateBrand(tenantId, brandId);
            }

            // Create button content - show state as text
            button.innerHTML = `
                <span class="tenant-name">${tenantId}</span>
                <span class="brand-name">/ ${brandId}</span>
                <br>
                <span style="font-size: 0.85rem; font-weight: 600;">${state}</span>
            `;

            container.appendChild(button);
        });
    });
}

function updateComponentUI(componentId) {
    const state = componentStates[componentId];
    if (!state) return;

    // Check if state is an object (not a string or primitive)
    if (typeof state !== 'object') {
        console.warn(`Component state for ${componentId} is not an object:`, state);
        return;
    }

    // Update enabled badge
    const enabledBadge = $(`#enable-${componentId}`);
    if (enabledBadge) {
        toggleClass(enabledBadge, 'enabled', state.enabled);
        toggleClass(enabledBadge, 'disabled', !state.enabled);
        enabledBadge.textContent = state.enabled ? 'Enabled' : 'Disabled';
    }

    // Update status badge
    const statusBadge = $(`#status-${componentId}`);
    if (statusBadge && state.status) {
        toggleClass(statusBadge, 'ok', state.status === 'OK');
        statusBadge.textContent = state.status;
        show(statusBadge);
    }

    // Update power toggle
    const powerToggle = $(`#power-${componentId}`);
    if (powerToggle && state && typeof state === 'object' && 'power' in state) {
        updateToggleState(powerToggle, state.power);
    }

    // Update state display
    const stateEl = $(`#state-${componentId}`);
    if (stateEl) {
        updateComponentState(componentId, stateEl);
        if (!stateEl.innerHTML || stateEl.innerHTML.trim() === '') {
            hide(stateEl);
        } else {
            show(stateEl);
        }
    }

    // Update all toggles
    if (state && typeof state === 'object') {
        Object.keys(state).forEach(key => {
            const toggle = $(`[data-component-id="${componentId}"][data-param-name="${key}"]`);
            if (toggle && typeof state[key] === 'boolean') {
                updateToggleState(toggle, state[key]);
            }
        });
    }
}

function handleTenantUpdate(update) {
    const tenantId = update.tenant;
    const brandId = update.brand;
    const state = update.state;

    // Initialize tenants structure if needed
    if (!tenants[tenantId]) {
        tenants[tenantId] = {};
    }

    if (brandId) {
        // Update specific brand
        tenants[tenantId][brandId] = state;
        addLogEntry('received', `Tenant ${tenantId}/${brandId} state changed to ${state}`);
        console.log(`Tenant update: ${tenantId}/${brandId} -> ${state}`, update);
    } else {
        // No brand specified - update ALL brands for this tenant
        Object.keys(tenants[tenantId]).forEach(brand => {
            tenants[tenantId][brand] = state;
        });
        addLogEntry('received', `Tenant ${tenantId} (all brands) state changed to ${state}`);
        console.log(`Tenant update: ${tenantId} (all brands) -> ${state}`, update);
    }

    // Update the UI
    updateTenantButtons();
}

function handleComponentUpdate(msg) {
    const componentId = msg.componentID;

    // Initialize state if needed
    if (!componentStates[componentId]) {
        componentStates[componentId] = {};
    }

    // Update state with all properties from the message
    Object.keys(msg).forEach(key => {
        if (key !== 'componentID' && key !== 'previous' && key !== 'requestId') {
            componentStates[componentId][key] = msg[key];
        }
    });

    addLogEntry('received', `Component #${componentId} update:`, msg);
    updateComponentUI(componentId);
}

function createActionRow(componentId, actionName, params) {
    const template = $('#action-row-template');
    const row = template.content.cloneNode(true).firstElementChild;
    row.dataset.componentId = componentId;
    row.dataset.actionName = actionName;

    const label = $('.action-label', row);
    label.textContent = actionName;

    const inputs = $('.action-inputs', row);

    if (!params || Object.keys(params).length === 0) {
        // No parameters - just a button
        const button = document.createElement('button');
        button.className = 'action-button';
        button.textContent = 'Execute';
        button.onclick = async () => {
            button.disabled = true;
            try {
                await client.cmd(componentId, actionName, {});
                addLogEntry('sent', `Executed ${actionName} on component #${componentId} - OK`);
            } catch (error) {
                addLogEntry('error', `${actionName} failed for component #${componentId}: ${error.message}`);
            } finally {
                button.disabled = false;
            }
        };
        inputs.appendChild(button);
    } else {
        // Create inputs for each parameter
        Object.entries(params).forEach(([paramName, paramType]) => {
            const isOptional = paramType.endsWith('?');
            const type = paramType.replace('?', '');

            if (type === 'Boolean') {
                const control = createBooleanControl(componentId, actionName, paramName);
                inputs.appendChild(control);
            } else if (type === 'String') {
                const control = createStringControl(componentId, actionName, paramName);
                inputs.appendChild(control);
            }
        });
    }

    return row;
}

function createBooleanControl(componentId, actionName, paramName) {
    const toggle = createToggle();
    toggle.dataset.paramName = paramName;
    toggle.dataset.componentId = componentId;
    toggle.dataset.actionName = actionName;

    // Check if we have state for this value
    const state = componentStates[componentId];
    updateToggleState(toggle, state && state[paramName]);

    toggle.onclick = async () => {
        const newValue = toggle.dataset.value !== 'true';
        const originalValue = toggle.dataset.value === 'true';

        // Optimistically update UI
        updateToggleState(toggle, newValue);

        const args = {};
        if (actionName === 'power') {
            args.on = newValue;
        } else if (actionName === 'set_state') {
            args[paramName] = newValue;
        } else {
            args[paramName] = newValue;
        }

        try {
            const response = await client.cmd(componentId, actionName, args);
            addLogEntry('sent', `${actionName} ${paramName}: ${newValue} on component #${componentId} - OK`);

            // Update local state since command succeeded
            if (!componentStates[componentId]) componentStates[componentId] = {};

            // Store the state based on what was sent
            if (actionName === 'power') {
                componentStates[componentId].power = newValue;
            } else if (actionName === 'set_state') {
                componentStates[componentId][paramName] = newValue;
            }

            // Request fresh state to ensure UI is in sync
            setTimeout(() => refreshState(), 100);
        } catch (error) {
            // Revert on error
            updateToggleState(toggle, originalValue);
            addLogEntry('error', `${actionName} failed for component #${componentId}: ${error.message}`);
        }
    };

    const wrapper = document.createElement('div');
    wrapper.className = 'action-param-row';

    const label = document.createElement('span');
    label.className = 'action-param-label';
    label.textContent = paramName.replace(/_/g, ' ');

    wrapper.appendChild(label);
    wrapper.appendChild(toggle);

    return wrapper;
}

function createStringControl(componentId, actionName, paramName) {
    const wrapper = document.createElement('div');
    wrapper.className = 'action-param-row';

    const label = document.createElement('span');
    label.className = 'action-param-label';
    label.textContent = paramName.replace(/_/g, ' ');

    const input = document.createElement('input');
    input.className = 'action-input';
    input.type = 'text';
    input.placeholder = `Press Enter to send`;
    input.dataset.paramName = paramName;
    input.dataset.componentId = componentId;
    input.dataset.actionName = actionName;

    input.onkeypress = async (e) => {
        if (e.key === 'Enter') {
            const value = input.value.trim();
            if (value) {
                const args = {};
                args[paramName] = value;

                input.disabled = true;
                try {
                    await client.cmd(componentId, actionName, args);
                    addLogEntry('sent', `${actionName} ${paramName}: "${value}" on component #${componentId} - OK`);
                    input.value = '';
                } catch (error) {
                    addLogEntry('error', `${actionName} failed for component #${componentId}: ${error.message}`);
                } finally {
                    input.disabled = false;
                }
            }
        }
    };

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
}

async function connect() {
    const url = document.getElementById('wsUrl').value;

    if (!url) {
        addLogEntry('error', 'Please enter a WebSocket URL');
        return;
    }

    updateConnectionStatus('connecting');
    addLogEntry('sent', `Connecting to ${url}`);

    try {
        client = new CUSS2DevToolsClient({ url });

        client.on('connected', () => {
            updateConnectionStatus('connected');
            addLogEntry('received', 'Connection established');

            // Request initial state and tenants after connection
            setTimeout(async () => {
                await fetchTenants();
                await refreshState();
            }, 500);
        });

        client.on('disconnected', (reason) => {
            updateConnectionStatus('disconnected');
            addLogEntry('error', `Disconnected: ${reason || 'Connection closed'}`);
            components = [];
            tenants = {};
            updateComponentList();
            updateTenantButtons();
        });

        client.on('components', (comps) => {
            // Components should be an array now
            components = Array.isArray(comps) ? comps : [];
            updateComponentList();
            addLogEntry('received', `Discovered ${components.length} components`);
        });

        client.on('tenant_update', (update) => {
            handleTenantUpdate(update);
        });

        client.on('message', (msg) => {
            addLogEntry('received', 'Platform message', msg);

            // Check if this is a component update broadcast
            if ('componentID' in msg && !msg.action) {
                handleComponentUpdate(msg);
                return;
            }

            // Check if this message contains component data in a different format
            if (msg.components) {
                components = Array.isArray(msg.components) ? msg.components : [];
                updateComponentList();
                addLogEntry('received', `Found ${components.length} components in message`);
            }

            // Check if this is a component states response (not a tenant state update)
            // Component states response will have msg.state as an object, not a string
            if (msg.state && typeof msg.state === 'object' && !('tenant' in msg)) {
                console.log('Received component states response:', msg.state);
                componentStates = msg.state;
                addLogEntry('received', 'Component states updated');

                // Update all components
                Object.keys(componentStates).forEach(id => {
                    console.log(`Updating component ${id} with state:`, componentStates[id]);
                    updateComponentUI(id);
                });
            }
        });

        client.on('error', (error) => {
            addLogEntry('error', `Error: ${error.message || error}`);
        });

        await client.connect();
    } catch (error) {
        updateConnectionStatus('disconnected');
        addLogEntry('error', `Connection failed: ${error.message || error}`);
    }
}

function disconnect() {
    if (client) {
        client.disconnect();
        client = null;
    }
}
