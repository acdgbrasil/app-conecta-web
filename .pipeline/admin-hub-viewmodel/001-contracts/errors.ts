// Admin Hub ViewModel — Error types
//
// A pure reducer has no failure paths of its own: it always returns
// a new state. Errors from service calls arrive as action payloads
// (LOAD_*_FAILURE with an `error: string` field) and are stored in
// per-tab `*Error` state slots.
//
// This file is intentionally empty of error unions because the
// viewmodel delegates error origination to the service layer
// (ServiceError from base-client.ts) and merely stores the
// user-facing message string dispatched by the Page.
//
// Keeping the file present satisfies the 001-contracts/ convention
// and documents the deliberate design decision.
