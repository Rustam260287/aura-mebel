import { Context7 } from '@upstash/context7-mcp'

export const context7 = new Context7({
  url: process.env.CONTEXT7_URL!,
  token: process.env.CONTEXT7_TOKEN!,
})
