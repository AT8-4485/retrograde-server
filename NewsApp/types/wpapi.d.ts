declare module "wpapi" {
  export default class WPAPI {
    constructor(options: { endpoint: string })
    posts(): any
  }
}
