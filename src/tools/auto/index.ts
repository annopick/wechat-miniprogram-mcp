import {
  connectAuto,
  disconnectAuto,
  closeAuto,
  getConnection,
  type ConnectOptions,
} from '../../api/auto.js'

export interface AutoTool {
  name: string
  description: string
  inputSchema: object
  handler: (args: Record<string, unknown>) => Promise<unknown>
}

function textContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] }
}

function imageContent(base64: string) {
  return { content: [{ type: 'image' as const, data: base64, mimeType: 'image/png' }] }
}

async function requireConnection() {
  const mp = getConnection()
  if (!mp) {
    throw new Error('Not connected. Call wechat_auto_connect with action "connect" first.')
  }
  return mp
}

async function resolveElement(mp: any, selector: string, parentSelector?: string) {
  const page = await mp.currentPage()
  let element: any
  if (parentSelector) {
    const parent = await page.$(parentSelector)
    if (!parent) throw new Error(`Parent element not found: ${parentSelector}`)
    element = await parent.$(selector)
  } else {
    element = await page.$(selector)
  }
  if (!element) throw new Error(`Element not found: ${selector}`)
  return element
}

export const autoTools: AutoTool[] = [
  // === Session Management ===
  {
    name: 'wechat_auto_connect',
    description: 'Manage automator session: connect (launch DevTools), disconnect, close, or enable remote debugging',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['connect', 'disconnect', 'close', 'remote'], description: 'Session action to perform' },
        ticket: { type: 'string', description: 'For connect: login ticket from another DevTools instance' },
        account: { type: 'string', description: 'For connect: openid of a test account' },
        auto: { type: 'boolean', description: 'For remote action: enable auto-connect without QR scan' },
      },
      required: ['action'],
    },
    handler: async (args) => {
      const action = args.action as string
      switch (action) {
        case 'connect': {
          const options: ConnectOptions = {}
          if (args.ticket) options.ticket = args.ticket as string
          if (args.account) options.account = args.account as string
          const mp = await connectAuto(options)
          const page = await mp.currentPage()
          return textContent({ connected: true, currentPage: page?.path || null })
        }
        case 'disconnect':
          await disconnectAuto()
          return textContent({ disconnected: true })
        case 'close':
          await closeAuto()
          return textContent({ closed: true })
        case 'remote': {
          const mp = await requireConnection()
          await mp.remote(args.auto === true)
          return textContent({ remote: true })
        }
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Navigation ===
  {
    name: 'wechat_auto_navigate',
    description: 'Navigate between pages: navigateTo, redirectTo, navigateBack, reLaunch, switchTab',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['navigateTo', 'redirectTo', 'navigateBack', 'reLaunch', 'switchTab'], description: 'Navigation method' },
        url: { type: 'string', description: 'Target page path (not required for navigateBack)' },
      },
      required: ['action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const action = args.action as string
      const url = args.url as string | undefined
      let page: any

      switch (action) {
        case 'navigateTo':
          if (!url) throw new Error('url is required for navigateTo')
          page = await mp.navigateTo(url)
          break
        case 'redirectTo':
          if (!url) throw new Error('url is required for redirectTo')
          page = await mp.redirectTo(url)
          break
        case 'navigateBack':
          page = await mp.navigateBack()
          break
        case 'reLaunch':
          if (!url) throw new Error('url is required for reLaunch')
          page = await mp.reLaunch(url)
          break
        case 'switchTab':
          if (!url) throw new Error('url is required for switchTab')
          page = await mp.switchTab(url)
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }
      return textContent({ path: page?.path, query: page?.query })
    },
  },

  // === Page Info ===
  {
    name: 'wechat_auto_page_info',
    description: 'Get page information: currentPage, pageStack, systemInfo, size, scrollTop, or scroll to position',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['currentPage', 'pageStack', 'systemInfo', 'size', 'scrollTop', 'pageScrollTo'], description: 'Info action' },
        scrollTop: { type: 'number', description: 'For pageScrollTo: target scroll position in px' },
      },
      required: ['action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const action = args.action as string

      switch (action) {
        case 'currentPage': {
          const page = await mp.currentPage()
          return textContent({ path: page.path, query: page.query })
        }
        case 'pageStack': {
          const stack = await mp.pageStack()
          return textContent(stack.map((p: any) => ({ path: p.path, query: p.query })))
        }
        case 'systemInfo':
          return textContent(await mp.systemInfo())
        case 'size': {
          const page = await mp.currentPage()
          return textContent(await page.size())
        }
        case 'scrollTop': {
          const page = await mp.currentPage()
          return textContent({ scrollTop: await page.scrollTop() })
        }
        case 'pageScrollTo': {
          if (args.scrollTop === undefined) throw new Error('scrollTop is required for pageScrollTo')
          await mp.pageScrollTo(args.scrollTop as number)
          return textContent({ scrolledTo: args.scrollTop })
        }
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Page Data ===
  {
    name: 'wechat_auto_page_data',
    description: 'Read or write page rendering data',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set'], description: 'get or set page data' },
        path: { type: 'string', description: 'For get: data path to retrieve' },
        data: { type: 'object', description: 'For set: data object to set' },
      },
      required: ['action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const page = await mp.currentPage()
      const action = args.action as string

      if (action === 'get') {
        const result = await page.data(args.path as string | undefined)
        return textContent(result)
      } else if (action === 'set') {
        if (!args.data) throw new Error('data is required for set action')
        await page.setData(args.data)
        return textContent({ success: true })
      }
      throw new Error(`Unknown action: ${action}`)
    },
  },

  // === Page Query ===
  {
    name: 'wechat_auto_page_query',
    description: 'Query page elements or wait for conditions',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['select', 'selectAll', 'waitFor'], description: 'Query action' },
        selector: { type: 'string', description: 'CSS selector for select/selectAll' },
        condition: { type: ['string', 'number'], description: 'For waitFor: selector string or timeout ms' },
        timeout: { type: 'number', description: 'For waitFor: max wait time in ms (default 30000)' },
      },
      required: ['action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const page = await mp.currentPage()
      const action = args.action as string

      switch (action) {
        case 'select': {
          if (!args.selector) throw new Error('selector is required')
          const el = await page.$(args.selector as string)
          if (!el) return textContent({ found: false })
          return textContent({ found: true, tagName: el.tagName })
        }
        case 'selectAll': {
          if (!args.selector) throw new Error('selector is required')
          const els = await page.$$(args.selector as string)
          return textContent({ count: els.length, tagNames: els.map((e: any) => e.tagName) })
        }
        case 'waitFor': {
          const condition = args.condition
          if (condition === undefined) throw new Error('condition is required for waitFor')
          if (typeof condition !== 'string' && typeof condition !== 'number') {
            throw new Error('condition must be a string (selector) or number (timeout ms)')
          }
          await page.waitFor(condition)
          return textContent({ waited: true, condition })
        }
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Page Call Method ===
  {
    name: 'wechat_auto_page_call_method',
    description: 'Call a method on the current page',
    inputSchema: {
      type: 'object',
      properties: {
        method: { type: 'string', description: 'Method name to call' },
        args: { type: 'array', description: 'Arguments to pass to the method' },
      },
      required: ['method'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const page = await mp.currentPage()
      const methodArgs = (args.args as any[]) || []
      const result = await page.callMethod(args.method as string, ...methodArgs)
      return textContent(result)
    },
  },

  // === Call wx Method ===
  {
    name: 'wechat_auto_call_wx_method',
    description: 'Call a method on the wx object (or plugin wx object)',
    inputSchema: {
      type: 'object',
      properties: {
        method: { type: 'string', description: 'wx method name' },
        args: { type: 'array', description: 'Method arguments' },
        pluginId: { type: 'string', description: 'Plugin ID (uses callPluginWxMethod when provided)' },
      },
      required: ['method'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const methodArgs = (args.args as any[]) || []
      let result: any
      if (args.pluginId) {
        result = await mp.callPluginWxMethod(args.pluginId as string, args.method as string, ...methodArgs)
      } else {
        result = await mp.callWxMethod(args.method as string, ...methodArgs)
      }
      return textContent(result)
    },
  },

  // === Mock wx Method ===
  {
    name: 'wechat_auto_mock_wx_method',
    description: 'Mock or restore wx methods for testing',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['mock', 'restore'], description: 'mock or restore' },
        method: { type: 'string', description: 'wx method name' },
        result: { description: 'For mock: direct return value' },
        fn: { type: 'string', description: 'For mock: function code string as handler' },
        args: { type: 'array', description: 'For mock with fn: additional arguments' },
        pluginId: { type: 'string', description: 'Plugin ID for plugin wx methods' },
      },
      required: ['action', 'method'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const action = args.action as string
      const method = args.method as string
      const pluginId = args.pluginId as string | undefined

      if (action === 'mock') {
        if (args.fn !== undefined) {
          const fnArgs = (args.args as any[]) || []
          if (pluginId) {
            await mp.mockPluginWxMethod(pluginId, method, args.fn as string, ...fnArgs)
          } else {
            await mp.mockWxMethod(method, args.fn as string, ...fnArgs)
          }
        } else {
          if (pluginId) {
            await mp.mockPluginWxMethod(pluginId, method, args.result)
          } else {
            await mp.mockWxMethod(method, args.result)
          }
        }
        return textContent({ mocked: method })
      } else if (action === 'restore') {
        if (pluginId) {
          await mp.restorePluginWxMethod(pluginId, method)
        } else {
          await mp.restoreWxMethod(method)
        }
        return textContent({ restored: method })
      }
      throw new Error(`Unknown action: ${action}`)
    },
  },

  // === Evaluate ===
  {
    name: 'wechat_auto_evaluate',
    description: 'Execute code in the Mini Program AppService and return the result',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code string to execute' },
        args: { type: 'array', description: 'Arguments passed to the code' },
      },
      required: ['code'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const code = args.code as string
      const evalArgs = (args.args as any[]) || []
      const result = await mp.evaluate(code, ...evalArgs)
      return textContent(result)
    },
  },

  // === Screenshot ===
  {
    name: 'wechat_auto_screenshot',
    description: 'Take a screenshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to save screenshot. If omitted, returns base64.' },
      },
      required: [],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      if (args.path) {
        await mp.screenshot({ path: args.path as string })
        return textContent({ saved: args.path })
      }
      const base64 = await mp.screenshot()
      return imageContent(base64)
    },
  },

  // === Element Info ===
  {
    name: 'wechat_auto_element_info',
    description: 'Get element information: text, value, attribute, property, style, wxml, outerWxml, size, offset',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to find the element' },
        parentSelector: { type: 'string', description: 'Optional parent selector for nested lookup' },
        action: { type: 'string', enum: ['text', 'value', 'attribute', 'property', 'style', 'wxml', 'outerWxml', 'size', 'offset'], description: 'Info to retrieve' },
        name: { type: 'string', description: 'For attribute/property/style: the name to query' },
      },
      required: ['selector', 'action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const element = await resolveElement(mp, args.selector as string, args.parentSelector as string | undefined)
      const action = args.action as string

      switch (action) {
        case 'text': return textContent(await element.text())
        case 'value': return textContent(await element.value())
        case 'attribute': {
          if (!args.name) throw new Error('name is required for attribute')
          return textContent(await element.attribute(args.name as string))
        }
        case 'property': {
          if (!args.name) throw new Error('name is required for property')
          return textContent(await element.property(args.name as string))
        }
        case 'style': {
          if (!args.name) throw new Error('name is required for style')
          return textContent(await element.style(args.name as string))
        }
        case 'wxml': return textContent(await element.wxml())
        case 'outerWxml': return textContent(await element.outerWxml())
        case 'size': return textContent(await element.size())
        case 'offset': return textContent(await element.offset())
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Element Action ===
  {
    name: 'wechat_auto_element_action',
    description: 'Interact with an element: tap, longpress, input, trigger',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to find the element' },
        parentSelector: { type: 'string', description: 'Optional parent selector for nested lookup' },
        action: { type: 'string', enum: ['tap', 'longpress', 'input', 'trigger'], description: 'Interaction to perform' },
        value: { type: 'string', description: 'For input: text to input' },
        type: { type: 'string', description: 'For trigger: event type' },
        detail: { type: 'object', description: 'For trigger: event detail object' },
      },
      required: ['selector', 'action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const element = await resolveElement(mp, args.selector as string, args.parentSelector as string | undefined)
      const action = args.action as string

      switch (action) {
        case 'tap':
          await element.tap()
          return textContent({ tapped: true })
        case 'longpress':
          await element.longpress()
          return textContent({ longpressed: true })
        case 'input': {
          if (!args.value) throw new Error('value is required for input')
          await element.input(args.value as string)
          return textContent({ input: args.value })
        }
        case 'trigger': {
          if (!args.type) throw new Error('type is required for trigger')
          await element.trigger(args.type as string, args.detail as object | undefined)
          return textContent({ triggered: args.type })
        }
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Element Touch ===
  {
    name: 'wechat_auto_element_touch',
    description: 'Perform touch gestures on an element: touchstart, touchmove, touchend',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to find the element' },
        parentSelector: { type: 'string', description: 'Optional parent selector for nested lookup' },
        action: { type: 'string', enum: ['touchstart', 'touchmove', 'touchend'], description: 'Touch action' },
        touches: { type: 'array', description: 'Array of touch points (identifier, pageX, pageY)' },
        changedTouches: { type: 'array', description: 'Array of changed touch points' },
      },
      required: ['selector', 'action', 'touches', 'changedTouches'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const element = await resolveElement(mp, args.selector as string, args.parentSelector as string | undefined)
      const action = args.action as string
      const options = { touches: args.touches, changedTouches: args.changedTouches }

      switch (action) {
        case 'touchstart':
          await element.touchstart(options)
          break
        case 'touchmove':
          await element.touchmove(options)
          break
        case 'touchend':
          await element.touchend(options)
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }
      return textContent({ [action]: true })
    },
  },

  // === Element Scroll ===
  {
    name: 'wechat_auto_element_scroll',
    description: 'Scroll operations on scroll-view elements: scrollTo, scrollWidth, scrollHeight',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the scroll-view element' },
        parentSelector: { type: 'string', description: 'Optional parent selector' },
        action: { type: 'string', enum: ['scrollTo', 'scrollWidth', 'scrollHeight'], description: 'Scroll action' },
        x: { type: 'number', description: 'For scrollTo: horizontal position' },
        y: { type: 'number', description: 'For scrollTo: vertical position' },
      },
      required: ['selector', 'action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const element = await resolveElement(mp, args.selector as string, args.parentSelector as string | undefined)
      const action = args.action as string

      switch (action) {
        case 'scrollTo': {
          if (args.x === undefined || args.y === undefined) throw new Error('x and y are required for scrollTo')
          await element.scrollTo(args.x as number, args.y as number)
          return textContent({ scrolledTo: { x: args.x, y: args.y } })
        }
        case 'scrollWidth':
          return textContent({ scrollWidth: await element.scrollWidth() })
        case 'scrollHeight':
          return textContent({ scrollHeight: await element.scrollHeight() })
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Element Special ===
  {
    name: 'wechat_auto_element_special',
    description: 'Special component operations: swipeTo (swiper), moveTo (movable-view), slideTo (slider)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the component' },
        parentSelector: { type: 'string', description: 'Optional parent selector' },
        action: { type: 'string', enum: ['swipeTo', 'moveTo', 'slideTo'], description: 'Special action' },
        index: { type: 'number', description: 'For swipeTo: target slide index' },
        x: { type: 'number', description: 'For moveTo: x offset' },
        y: { type: 'number', description: 'For moveTo: y offset' },
        value: { type: 'number', description: 'For slideTo: target value' },
      },
      required: ['selector', 'action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const element = await resolveElement(mp, args.selector as string, args.parentSelector as string | undefined)
      const action = args.action as string

      switch (action) {
        case 'swipeTo': {
          if (args.index === undefined) throw new Error('index is required for swipeTo')
          await element.swipeTo(args.index as number)
          return textContent({ swipedTo: args.index })
        }
        case 'moveTo': {
          if (args.x === undefined || args.y === undefined) throw new Error('x and y are required for moveTo')
          await element.moveTo(args.x as number, args.y as number)
          return textContent({ movedTo: { x: args.x, y: args.y } })
        }
        case 'slideTo': {
          if (args.value === undefined) throw new Error('value is required for slideTo')
          await element.slideTo(args.value as number)
          return textContent({ slidTo: args.value })
        }
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Element Data ===
  {
    name: 'wechat_auto_element_data',
    description: 'Custom component data operations: getData, setData, callMethod, callContextMethod',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the component' },
        parentSelector: { type: 'string', description: 'Optional parent selector' },
        action: { type: 'string', enum: ['getData', 'setData', 'callMethod', 'callContextMethod'], description: 'Data action' },
        path: { type: 'string', description: 'For getData: data path' },
        data: { type: 'object', description: 'For setData: data object to set' },
        method: { type: 'string', description: 'For callMethod/callContextMethod: method name' },
        args: { type: 'array', description: 'For callMethod/callContextMethod: method arguments' },
      },
      required: ['selector', 'action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const element = await resolveElement(mp, args.selector as string, args.parentSelector as string | undefined)
      const action = args.action as string

      switch (action) {
        case 'getData':
          return textContent(await element.data(args.path as string | undefined))
        case 'setData': {
          if (!args.data) throw new Error('data is required for setData')
          await element.setData(args.data)
          return textContent({ success: true })
        }
        case 'callMethod': {
          if (!args.method) throw new Error('method is required for callMethod')
          const methodArgs = (args.args as any[]) || []
          return textContent(await element.callMethod(args.method as string, ...methodArgs))
        }
        case 'callContextMethod': {
          if (!args.method) throw new Error('method is required for callContextMethod')
          const ctxArgs = (args.args as any[]) || []
          return textContent(await element.callContextMethod(args.method as string, ...ctxArgs))
        }
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Ticket ===
  {
    name: 'wechat_auto_ticket',
    description: 'Manage DevTools login ticket: get, set, or refresh',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set', 'refresh'], description: 'Ticket action' },
        ticket: { type: 'string', description: 'For set: the ticket string' },
      },
      required: ['action'],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const action = args.action as string

      switch (action) {
        case 'get':
          return textContent(await mp.getTicket())
        case 'set': {
          if (!args.ticket) throw new Error('ticket is required for set action')
          await mp.setTicket(args.ticket as string)
          return textContent({ success: true })
        }
        case 'refresh':
          await mp.refreshTicket()
          return textContent({ refreshed: true })
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },

  // === Test Accounts ===
  {
    name: 'wechat_auto_test_accounts',
    description: 'Get the list of test accounts configured for multi-account debugging',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const mp = await requireConnection()
      return textContent(await mp.testAccounts())
    },
  },

  // === Stop Audits ===
  {
    name: 'wechat_auto_stop_audits',
    description: 'Stop performance audits and get the report',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to save the audit report' },
      },
      required: [],
    },
    handler: async (args) => {
      const mp = await requireConnection()
      const options = args.path ? { path: args.path as string } : undefined
      const result = await mp.stopAudits(options)
      return textContent(result)
    },
  },
]
