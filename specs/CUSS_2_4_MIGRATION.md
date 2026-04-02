# CUSS v2.4 Migration — Changes Needed

Migration from `cuss2-typescript-models@2.0.1` to `@2.4.0`.

---

## 1. Breaking: Remove Accessible Mode

The entire `accessibleMode` concept has been removed from the spec.

### Source files to change

- **`src/cuss2.ts`**
  - Remove `accessibleMode: boolean = false` property (~line 101)
  - Remove `this.accessibleMode = payload?.applicationActivation?.accessibleMode` (~line 230)
  - Remove `acknowledgeAccessibleMode()` method (~lines 644–647)
  - Remove `PlatformDirectives.PLATFORM_APPLICATIONS_ACKNOWLEDGE_ACCESSIBLE` usage (~line 468)
  - Remove `accessibleMode: this.accessibleMode` from the `ApplicationState` payload built in state-request logic (~line 472)
- **`src/helper.ts`** — Remove any accessible-mode–related payload construction if present
- **`src/cuss2.state.test.ts`** — Remove/rewrite all tests referencing `accessibleMode` and `acknowledgeAccessibleMode` (lines 67, 158, 172, 280, 293, 298–380, 391–414)
- **`src/cuss2.data-communication.test.ts`** — Remove `accessibleMode` references (lines 215, 221, 233)
- **`src/models/Printer.test.ts`** — Remove `accessibleMode: false` from mock `ApplicationState` (line 42)

### Docs files to change

- **`docs/examples/js/tester/tester.js`**
  - Remove `accessibleMode` from `appInfo` object (lines 79, 434, 552, 565)
  - Remove `accessibleModeBanner` state and logic (lines 92, 992–1007)
  - Remove `cuss2.acknowledgeAccessibleMode()` call (line 1013)
  - Remove `cuss2.accessibleMode` checks (lines 552, 556)
- **`docs/examples/tester.html`**
  - Remove "Accessible Mode" display (line 123)
  - Remove accessible mode banner markup (lines 336–340)
- **`docs/api/cuss2.html`** — Remove `accessibleMode: boolean` (line 107) *(or regenerate)*
- **`docs/api/api-raw.json`** — Will be regenerated

### Types removed from models
- `ApplicationActivation.accessibleMode` — field deleted
- `ApplicationState.accessibleMode` — field deleted
- `PlatformDirectives.PLATFORM_APPLICATIONS_ACKNOWLEDGE_ACCESSIBLE` — enum member deleted

---

## 2. ✅ Breaking: PlatformDirectives Renamed

Two enum members have been renamed (both key and value changed):

| Old Key (v2.0) | New Key (v2.4) |
|---|---|
| `PLATFORM_APPLICATIONS_STATEREQUEST` | `PLATFORM_APPLICATIONS_STATE_REQUEST` |
| `PLATFORM_APPLICATIONS_TRANSFERREQUEST` | `PLATFORM_APPLICATIONS_TRANSFER_REQUEST` |

### Source files changed

- **`src/cuss2.ts`** — All references to `PLATFORM_APPLICATIONS_STATEREQUEST`
- **`src/helper.ts`** (~line 186) — `PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST`
- **`src/helper.test.ts`** (lines 105, 110, 128, 137, 156)
- **`src/cuss2.data-communication.test.ts`** (line 25)
- **`src/test-helpers.ts`** (~line 133) — string literal `"PLATFORM_APPLICATIONS_STATEREQUEST"`
- **`src/connection.test.ts`** (lines 904, 956, 1002, 1068, 1133, 1226, 1255)

### Docs files changed

- **`docs/api/api-raw.json`** — Will be regenerated (contains old enum names at lines 14707, 14724)

---

## 3. Breaking: AckCodes.ACK_OAUTH_ERROR Removed

`ACK_OAUTH_ERROR` has been removed from the `AckCodes` enum.

### Files to change

- Search all source and test files for `ACK_OAUTH_ERROR` and remove/replace any references.
- **`docs/api/api-raw.json`** — Will be regenerated (lines 6137, 6177–6183)

---

## 4. Breaking: ComponentTypes Members Removed

Removed enum members: `STORAGE`, `DISPLAY`, `NETWORK`.

### Files to change

- **`src/componentInterrogation.ts`** — Remove any type guards or checks for these component types
- **`src/models/capabilities/ComponentCapabilities.ts`** — Remove any references
- **`src/types/modelExtensions.ts`** — Check if any extended types reference these
- **`docs/api/api-raw.json`** — Will be regenerated (lines 10038, 10197, 10214, 10231)

---

## 5. Breaking: DeviceTypes.DISPLAY Removed

### Files to change

- **`src/models/deviceType.ts`** — Remove `DISPLAY` from any device-type constants or mappings
- **`src/componentInterrogation.ts`** — Remove any interrogation logic for DISPLAY devices
- **`docs/api/api-raw.json`** — Will be regenerated (line 11264)

---

## 6. Breaking: PaymentsCharacteristics Changed from Enum to Type Alias

**Old:** `enum PaymentsCharacteristics { DEBIT, CREDIT, NFC, AMEX, ... }`
**New:** `type PaymentsCharacteristics = Array<'ENCRYPTED_MSR' | 'DEBIT' | 'CREDIT' | 'NFC' | 'CHIP_AND_PIN'>`

Card brand members (`AMEX`, `VISA`, `MASTERCARD`, etc.) are now in a separate `CardBrand` enum.

### Files to change

- Search all files for `PaymentsCharacteristics` enum usage — any dot-access like `PaymentsCharacteristics.VISA` will break
- Update to use the new array-of-strings type and `CardBrand` enum where needed
- **`docs/api/api-raw.json`** — Will be regenerated (lines 9878, 13920–13932)

---

## 7. ~~Breaking: applicationBrand Now Required~~ — DEFERRED

**Status:** The v2.4 spec made `applicationBrand` required on `ApplicationActivation`, `ApplicationState`, and `ApplicationTransfer`. However, applications have no way to know what the platform has configured as their brand before first activation — making it impossible to populate in self-activation state requests.

Issue raised with the CUSS working group to revert `applicationBrand` to optional. Using `@cuss/cuss2-typescript-models@2.4.0-nobrand` which reverts it to optional.

**No code changes needed.** Revisit if/when the CUSS group resolves the issue.

---

## 8. Non-Breaking: New CussDataTypes Members

New enum members added: `DS_TYPES_UNDEFINED`, `DS_TYPES_PAYMENT_ISO`, `DS_TYPES_PAYMENT_JIS2`, `DS_TYPES_FOID_JIS2`, `DS_TYPES_FOID_ISO`, `DS_TYPES_DISCRETIONARY_ISO`, `DS_TYPES_DISCRETIONARY_JIS2`.

### Files to change

- **`src/models/CardReader.ts`** (~line 15) — The `"DS_TYPES_PAYMENT_ISO" as CussDataTypes` assertion is **no longer needed** since it's now a real enum member. Remove the assertion.
- **`src/types/modelExtensions.ts`** — Remove `DS_TYPES_PAYMENT_ISO` from the extended `CussDataTypes` union (it's now in the upstream enum)
- **`src/componentInterrogation.ts`** — The `"SBDAEA" as CussDataTypes` assertion: check if `SBDAEA` is now in the enum; if not, keep the assertion in modelExtensions

---

## 9. Non-Breaking: New MessageCodes.DENIED

New enum member `DENIED = 'DENIED'` added.

### Files to change

- Consider handling `DENIED` in component state/response processing where `MessageCodes` are checked.

---

## 10. Non-Breaking: DeviceId Type Alias

`DeviceId` is now a separate type from `UniqueId`. Fields that changed:
- `ApplicationData.meta.deviceID`: `UniqueId` → `DeviceId`
- `PlatformData.meta.deviceID`: `UniqueId` → `DeviceId`
- `EnvironmentLevel.deviceID`: `UniqueId` → `DeviceId`

Both are `string` aliases so this is source-compatible.

### Files to change

- **`src/connection.ts`** — If `UniqueId` is used for `deviceID`, update to `DeviceId`

---

## 11. Non-Breaking: EnvironmentComponent Fields Now Required

`componentID`, `componentType`, and `componentCharacteristics` are no longer optional.

### Files to change

- Remove any null/undefined guards on these fields if they exist (code becomes simpler)
- Update test mocks to always include these fields

---

## 12. Non-Breaking: DocumentBin Typo Fix

`allmostFullLevel` → `almostFullLevel`, `allmostEmptyLevel` → `almostEmptyLevel` in `ComponentCharacteristics.documentBin`.

### Files to change

- Search all source and test files for `allmostFullLevel` and `allmostEmptyLevel` — update spellings
- **`docs/api/api-raw.json`** — Will be regenerated (lines 9527, 9548)

---

## 13. New Feature: Session Extension

New types: `SessionExtensionRequest`, `SessionExtensionResponse`
New directive: `PlatformDirectives.PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST`
New `EnvironmentLevel` fields: `sessionExtensionDuration`, `maxSessionExtensions`
New payload fields: `ApplicationData.payload.sessionExtensionRequest`, `PlatformData.payload.sessionExtensionResponse`

### Files to add/change

- **`src/cuss2.ts`** — Add `requestSessionExtension()` method (or similar API)
- **`src/helper.ts`** — Add payload builder for session extension requests
- **Tests** — Add coverage for session extension flow
- Consider exposing `sessionExtensionDuration` and `maxSessionExtensions` from environment

---

## 14. New Feature: Ping/Pong Heartbeat

New types: `Ping`, `Pong`

### Files to change

- **`src/connection.ts`** — Consider implementing heartbeat support if desired
- May be optional / platform-level only

---

## 15. New Feature: Encrypted MSR / Payment Updates

`EPaymentMessage` gained `ENCRYPTED_MSR` support:
- New `ePaymentMsgType` value
- New `setup.msrSecureKey` field
- New `transaction.transactionResponse.approval.msrSecureData` field
- New types: `MsrEncryptedDataType`, `MsrSecureKeyType`

### Files to change

- Review payment-related components and update if the SDK exposes payment setup/transaction APIs

---

## 16. New Feature: ConveyorSBD localBSMCapable

`ComponentCharacteristics.conveyorSBD` gained `localBSMCapable?: boolean`.

### Files to change

- Expose in component capabilities if the SDK surfaces SBD characteristics

---

## 17. ✅ Dependency Version Bump

### Files to change

- **`deno.jsonc`** (~line 23) — Update `jsr:@cuss/cuss2-typescript-models@2.0.1` to `@2.4.0-nobrand`

---

## Docs: General Notes

- **`docs/api/`** — All files (`api-raw.json`, `cuss2.html`, etc.) are generated. They will be updated automatically when the API docs are regenerated after source changes are complete.
- **`docs/dist/`** — Built JS bundles. Run `deno task build` after all source changes to rebuild.
- **`docs/examples/`** — Contains real application code (tester, moki) that must be updated manually. Primary impact is in the tester app for accessible mode removal (#1).

---

## Summary — Priority Order

| # | Change | Breaking? | Effort |
|---|--------|-----------|--------|
| 17 | ✅ Bump dependency version | — | Trivial |
| 2 | ✅ Rename PlatformDirectives | Yes | Low |
| 1 | Remove accessible mode | Yes | Medium |
| 7 | ~~applicationBrand required~~ DEFERRED | — | — |
| 6 | PaymentsCharacteristics enum→type | Yes | Low |
| 4 | Remove STORAGE/DISPLAY/NETWORK ComponentTypes | Yes | Low |
| 5 | Remove DeviceTypes.DISPLAY | Yes | Low |
| 3 | Remove ACK_OAUTH_ERROR | Yes | Low |
| 8 | Clean up CussDataTypes assertions | No | Trivial |
| 12 | Fix documentBin typos | No | Trivial |
| 11 | Simplify EnvironmentComponent null guards | No | Low |
| 10 | DeviceId type usage | No | Trivial |
| 9 | Handle MessageCodes.DENIED | No | Low |
| 13 | Session extension feature | No (new) | Medium |
| 14 | Ping/Pong heartbeat | No (new) | Low–Medium |
| 15 | Encrypted MSR payment | No (new) | Medium |
| 16 | SBD localBSMCapable | No (new) | Trivial |
