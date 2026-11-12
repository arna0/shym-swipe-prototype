// Used only in the static demo build: controllers import Express types, which
// have no runtime use in the browser.
export type Request = any;
export type Response = any;
export const Router = () => ({});
export default {};
