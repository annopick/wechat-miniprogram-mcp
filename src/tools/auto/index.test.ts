import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api/auto.js', () => ({
  connectAuto: vi.fn(),
  disconnectAuto: vi.fn(),
  closeAuto: vi.fn(),
  getConnection: vi.fn(),
}))

import { autoTools } from './index.js'
import { connectAuto, disconnectAuto, closeAuto, getConnection } from '../../api/auto.js'

function findTool(name: string) {
  const tool = autoTools.find((t) => t.name === name)
  if (!tool) throw new Error(`Tool not found: ${name}`)
  return tool
}

function createMockMiniProgram() {
  const mockPage = {
    path: 'pages/index/index',
    query: {},
    $: vi.fn(),
    $$: vi.fn(),
    waitFor: vi.fn(),
    data: vi.fn(),
    setData: vi.fn(),
    size: vi.fn().mockResolvedValue({ width: 375, height: 667 }),
    scrollTop: vi.fn().mockResolvedValue(0),
    callMethod: vi.fn(),
  }
  const mp = {
    currentPage: vi.fn().mockResolvedValue(mockPage),
    pageStack: vi.fn().mockResolvedValue([mockPage]),
    navigateTo: vi.fn().mockResolvedValue(mockPage),
    redirectTo: vi.fn().mockResolvedValue(mockPage),
    navigateBack: vi.fn().mockResolvedValue(mockPage),
    reLaunch: vi.fn().mockResolvedValue(mockPage),
    switchTab: vi.fn().mockResolvedValue(mockPage),
    systemInfo: vi.fn().mockResolvedValue({ platform: 'devtools' }),
    pageScrollTo: vi.fn(),
    callWxMethod: vi.fn(),
    callPluginWxMethod: vi.fn(),
    mockWxMethod: vi.fn(),
    mockPluginWxMethod: vi.fn(),
    restoreWxMethod: vi.fn(),
    restorePluginWxMethod: vi.fn(),
    evaluate: vi.fn(),
    screenshot: vi.fn(),
    remote: vi.fn(),
    disconnect: vi.fn(),
    close: vi.fn(),
    getTicket: vi.fn().mockResolvedValue({ ticket: 'abc', expiredTime: 9999 }),
    setTicket: vi.fn(),
    refreshTicket: vi.fn(),
    testAccounts: vi.fn().mockResolvedValue([{ nickName: 'test', openid: 'openid1' }]),
    stopAudits: vi.fn().mockResolvedValue({ score: 90 }),
  }
  return { mp, mockPage }
}

describe('Auto Tools', () => {
  let mp: any
  let mockPage: any

  beforeEach(() => {
    vi.clearAllMocks()
    const mocks = createMockMiniProgram()
    mp = mocks.mp
    mockPage = mocks.mockPage
    vi.mocked(getConnection).mockReturnValue(mp)
    vi.mocked(connectAuto).mockResolvedValue(mp)
    vi.mocked(disconnectAuto).mockResolvedValue(undefined)
    vi.mocked(closeAuto).mockResolvedValue(undefined)
  })

  it('should export all expected tools', () => {
    const names = autoTools.map((t) => t.name)
    expect(names).toContain('wechat_auto_connect')
    expect(names).toContain('wechat_auto_navigate')
    expect(names).toContain('wechat_auto_page_info')
    expect(names).toContain('wechat_auto_page_data')
    expect(names).toContain('wechat_auto_page_query')
    expect(names).toContain('wechat_auto_page_call_method')
    expect(names).toContain('wechat_auto_call_wx_method')
    expect(names).toContain('wechat_auto_mock_wx_method')
    expect(names).toContain('wechat_auto_evaluate')
    expect(names).toContain('wechat_auto_screenshot')
    expect(names).toContain('wechat_auto_element_info')
    expect(names).toContain('wechat_auto_element_action')
    expect(names).toContain('wechat_auto_element_touch')
    expect(names).toContain('wechat_auto_element_scroll')
    expect(names).toContain('wechat_auto_element_special')
    expect(names).toContain('wechat_auto_element_data')
    expect(names).toContain('wechat_auto_ticket')
    expect(names).toContain('wechat_auto_test_accounts')
    expect(names).toContain('wechat_auto_stop_audits')
    expect(names.length).toBe(19)
  })

  describe('wechat_auto_connect', () => {
    it('should connect and return current page', async () => {
      const tool = findTool('wechat_auto_connect')
      const result: any = await tool.handler({ action: 'connect' })
      expect(connectAuto).toHaveBeenCalled()
      expect(result.content[0].text).toContain('pages/index/index')
    })

    it('should disconnect', async () => {
      const tool = findTool('wechat_auto_connect')
      const result: any = await tool.handler({ action: 'disconnect' })
      expect(disconnectAuto).toHaveBeenCalled()
      expect(result.content[0].text).toContain('disconnected')
    })

    it('should close', async () => {
      const tool = findTool('wechat_auto_connect')
      const result: any = await tool.handler({ action: 'close' })
      expect(closeAuto).toHaveBeenCalled()
      expect(result.content[0].text).toContain('closed')
    })
  })

  describe('wechat_auto_navigate', () => {
    it('should navigateTo a page', async () => {
      const tool = findTool('wechat_auto_navigate')
      await tool.handler({ action: 'navigateTo', url: '/pages/detail/index' })
      expect(mp.navigateTo).toHaveBeenCalledWith('/pages/detail/index')
    })

    it('should navigateBack without url', async () => {
      const tool = findTool('wechat_auto_navigate')
      await tool.handler({ action: 'navigateBack' })
      expect(mp.navigateBack).toHaveBeenCalled()
    })

    it('should throw if url missing for navigateTo', async () => {
      const tool = findTool('wechat_auto_navigate')
      await expect(tool.handler({ action: 'navigateTo' })).rejects.toThrow('url is required')
    })
  })

  describe('wechat_auto_page_info', () => {
    it('should get currentPage', async () => {
      const tool = findTool('wechat_auto_page_info')
      const result: any = await tool.handler({ action: 'currentPage' })
      expect(result.content[0].text).toContain('pages/index/index')
    })

    it('should get systemInfo', async () => {
      const tool = findTool('wechat_auto_page_info')
      const result: any = await tool.handler({ action: 'systemInfo' })
      expect(result.content[0].text).toContain('devtools')
    })

    it('should get page size', async () => {
      const tool = findTool('wechat_auto_page_info')
      const result: any = await tool.handler({ action: 'size' })
      expect(result.content[0].text).toContain('375')
    })

    it('should pageScrollTo', async () => {
      const tool = findTool('wechat_auto_page_info')
      await tool.handler({ action: 'pageScrollTo', scrollTop: 100 })
      expect(mp.pageScrollTo).toHaveBeenCalledWith(100)
    })
  })

  describe('wechat_auto_page_data', () => {
    it('should get page data', async () => {
      mockPage.data.mockResolvedValue({ list: [1, 2, 3] })
      const tool = findTool('wechat_auto_page_data')
      const result: any = await tool.handler({ action: 'get', path: 'list' })
      expect(mockPage.data).toHaveBeenCalledWith('list')
      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.list).toEqual([1, 2, 3])
    })

    it('should set page data', async () => {
      const tool = findTool('wechat_auto_page_data')
      await tool.handler({ action: 'set', data: { text: 'hello' } })
      expect(mockPage.setData).toHaveBeenCalledWith({ text: 'hello' })
    })
  })

  describe('wechat_auto_page_query', () => {
    it('should select element', async () => {
      mockPage.$.mockResolvedValue({ tagName: 'view' })
      const tool = findTool('wechat_auto_page_query')
      const result: any = await tool.handler({ action: 'select', selector: '.test' })
      expect(result.content[0].text).toContain('view')
    })

    it('should selectAll elements', async () => {
      mockPage.$$.mockResolvedValue([{ tagName: 'view' }, { tagName: 'text' }])
      const tool = findTool('wechat_auto_page_query')
      const result: any = await tool.handler({ action: 'selectAll', selector: '.item' })
      expect(result.content[0].text).toContain('"count": 2')
    })

    it('should waitFor selector', async () => {
      const tool = findTool('wechat_auto_page_query')
      await tool.handler({ action: 'waitFor', condition: '.loaded' })
      expect(mockPage.waitFor).toHaveBeenCalledWith('.loaded')
    })

    it('should waitFor timeout', async () => {
      const tool = findTool('wechat_auto_page_query')
      await tool.handler({ action: 'waitFor', condition: 5000 })
      expect(mockPage.waitFor).toHaveBeenCalledWith(5000)
    })
  })

  describe('wechat_auto_call_wx_method', () => {
    it('should call wx method', async () => {
      mp.callWxMethod.mockResolvedValue({ data: 'test' })
      const tool = findTool('wechat_auto_call_wx_method')
      const result: any = await tool.handler({ method: 'getStorageSync', args: ['key'] })
      expect(mp.callWxMethod).toHaveBeenCalledWith('getStorageSync', 'key')
      expect(result.content[0].text).toContain('test')
    })

    it('should call plugin wx method', async () => {
      mp.callPluginWxMethod.mockResolvedValue('ok')
      const tool = findTool('wechat_auto_call_wx_method')
      await tool.handler({ method: 'getData', pluginId: 'plugin1', args: [] })
      expect(mp.callPluginWxMethod).toHaveBeenCalledWith('plugin1', 'getData')
    })
  })

  describe('wechat_auto_mock_wx_method', () => {
    it('should mock with result', async () => {
      const tool = findTool('wechat_auto_mock_wx_method')
      await tool.handler({ action: 'mock', method: 'showModal', result: { confirm: true } })
      expect(mp.mockWxMethod).toHaveBeenCalledWith('showModal', { confirm: true })
    })

    it('should mock with fn string', async () => {
      const tool = findTool('wechat_auto_mock_wx_method')
      await tool.handler({ action: 'mock', method: 'getStorageSync', fn: 'function(k) { return k }', args: ['default'] })
      expect(mp.mockWxMethod).toHaveBeenCalledWith('getStorageSync', 'function(k) { return k }', 'default')
    })

    it('should restore', async () => {
      const tool = findTool('wechat_auto_mock_wx_method')
      await tool.handler({ action: 'restore', method: 'showModal' })
      expect(mp.restoreWxMethod).toHaveBeenCalledWith('showModal')
    })
  })

  describe('wechat_auto_evaluate', () => {
    it('should evaluate code and return result', async () => {
      mp.evaluate.mockResolvedValue({ platform: 'devtools' })
      const tool = findTool('wechat_auto_evaluate')
      const result: any = await tool.handler({ code: 'return wx.getSystemInfoSync()' })
      expect(mp.evaluate).toHaveBeenCalledWith('return wx.getSystemInfoSync()')
      expect(result.content[0].text).toContain('devtools')
    })

    it('should pass args to evaluate', async () => {
      mp.evaluate.mockResolvedValue(undefined)
      const tool = findTool('wechat_auto_evaluate')
      await tool.handler({ code: 'wx.setStorageSync(arguments[0], arguments[1])', args: ['k', 'v'] })
      expect(mp.evaluate).toHaveBeenCalledWith('wx.setStorageSync(arguments[0], arguments[1])', 'k', 'v')
    })
  })

  describe('wechat_auto_screenshot', () => {
    it('should return base64 image when no path', async () => {
      mp.screenshot.mockResolvedValue('iVBORw0KGgo=')
      const tool = findTool('wechat_auto_screenshot')
      const result: any = await tool.handler({})
      expect(result.content[0].type).toBe('image')
      expect(result.content[0].data).toBe('iVBORw0KGgo=')
    })

    it('should save to path when provided', async () => {
      const tool = findTool('wechat_auto_screenshot')
      const result: any = await tool.handler({ path: '/tmp/shot.png' })
      expect(mp.screenshot).toHaveBeenCalledWith({ path: '/tmp/shot.png' })
      expect(result.content[0].text).toContain('/tmp/shot.png')
    })
  })

  describe('wechat_auto_element_info', () => {
    it('should get element text', async () => {
      const mockEl = { text: vi.fn().mockResolvedValue('Hello') }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_info')
      const result: any = await tool.handler({ selector: '.title', action: 'text' })
      expect(result.content[0].text).toContain('Hello')
    })

    it('should get element attribute', async () => {
      const mockEl = { attribute: vi.fn().mockResolvedValue('logo.png') }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_info')
      const result: any = await tool.handler({ selector: '.logo', action: 'attribute', name: 'src' })
      expect(mockEl.attribute).toHaveBeenCalledWith('src')
      expect(result.content[0].text).toContain('logo.png')
    })

    it('should throw if element not found', async () => {
      mockPage.$.mockResolvedValue(null)
      const tool = findTool('wechat_auto_element_info')
      await expect(tool.handler({ selector: '.missing', action: 'text' })).rejects.toThrow('Element not found')
    })
  })

  describe('wechat_auto_element_action', () => {
    it('should tap element', async () => {
      const mockEl = { tap: vi.fn() }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_action')
      await tool.handler({ selector: '.btn', action: 'tap' })
      expect(mockEl.tap).toHaveBeenCalled()
    })

    it('should input text', async () => {
      const mockEl = { input: vi.fn() }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_action')
      await tool.handler({ selector: 'input', action: 'input', value: 'hello' })
      expect(mockEl.input).toHaveBeenCalledWith('hello')
    })

    it('should trigger event', async () => {
      const mockEl = { trigger: vi.fn() }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_action')
      await tool.handler({ selector: 'picker', action: 'trigger', type: 'change', detail: { value: 1 } })
      expect(mockEl.trigger).toHaveBeenCalledWith('change', { value: 1 })
    })
  })

  describe('wechat_auto_element_touch', () => {
    it('should perform touchstart', async () => {
      const mockEl = { touchstart: vi.fn() }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_touch')
      const touches = [{ identifier: 1, pageX: 100, pageY: 200 }]
      await tool.handler({ selector: '.area', action: 'touchstart', touches, changedTouches: touches })
      expect(mockEl.touchstart).toHaveBeenCalledWith({ touches, changedTouches: touches })
    })
  })

  describe('wechat_auto_element_scroll', () => {
    it('should scrollTo position', async () => {
      const mockEl = { scrollTo: vi.fn() }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_scroll')
      await tool.handler({ selector: 'scroll-view', action: 'scrollTo', x: 0, y: 100 })
      expect(mockEl.scrollTo).toHaveBeenCalledWith(0, 100)
    })

    it('should get scrollHeight', async () => {
      const mockEl = { scrollHeight: vi.fn().mockResolvedValue(2000) }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_scroll')
      const result: any = await tool.handler({ selector: 'scroll-view', action: 'scrollHeight' })
      expect(result.content[0].text).toContain('2000')
    })
  })

  describe('wechat_auto_element_special', () => {
    it('should swipeTo index', async () => {
      const mockEl = { swipeTo: vi.fn() }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_special')
      await tool.handler({ selector: 'swiper', action: 'swipeTo', index: 2 })
      expect(mockEl.swipeTo).toHaveBeenCalledWith(2)
    })

    it('should slideTo value', async () => {
      const mockEl = { slideTo: vi.fn() }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_special')
      await tool.handler({ selector: 'slider', action: 'slideTo', value: 50 })
      expect(mockEl.slideTo).toHaveBeenCalledWith(50)
    })
  })

  describe('wechat_auto_element_data', () => {
    it('should getData from component', async () => {
      const mockEl = { data: vi.fn().mockResolvedValue({ count: 5 }) }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_data')
      const result: any = await tool.handler({ selector: 'my-component', action: 'getData', path: 'count' })
      expect(mockEl.data).toHaveBeenCalledWith('count')
      expect(result.content[0].text).toContain('5')
    })

    it('should callMethod on component', async () => {
      const mockEl = { callMethod: vi.fn().mockResolvedValue('result') }
      mockPage.$.mockResolvedValue(mockEl)
      const tool = findTool('wechat_auto_element_data')
      await tool.handler({ selector: 'my-component', action: 'callMethod', method: 'refresh', args: [1] })
      expect(mockEl.callMethod).toHaveBeenCalledWith('refresh', 1)
    })
  })

  describe('wechat_auto_ticket', () => {
    it('should get ticket', async () => {
      const tool = findTool('wechat_auto_ticket')
      const result: any = await tool.handler({ action: 'get' })
      expect(result.content[0].text).toContain('abc')
    })

    it('should set ticket', async () => {
      const tool = findTool('wechat_auto_ticket')
      await tool.handler({ action: 'set', ticket: 'newticket' })
      expect(mp.setTicket).toHaveBeenCalledWith('newticket')
    })

    it('should refresh ticket', async () => {
      const tool = findTool('wechat_auto_ticket')
      await tool.handler({ action: 'refresh' })
      expect(mp.refreshTicket).toHaveBeenCalled()
    })
  })

  describe('wechat_auto_test_accounts', () => {
    it('should return test accounts', async () => {
      const tool = findTool('wechat_auto_test_accounts')
      const result: any = await tool.handler({})
      expect(result.content[0].text).toContain('openid1')
    })
  })

  describe('wechat_auto_stop_audits', () => {
    it('should stop audits and return report', async () => {
      const tool = findTool('wechat_auto_stop_audits')
      const result: any = await tool.handler({ path: '/tmp/report.html' })
      expect(mp.stopAudits).toHaveBeenCalledWith({ path: '/tmp/report.html' })
      expect(result.content[0].text).toContain('90')
    })
  })

  describe('error handling', () => {
    it('should throw when not connected', async () => {
      vi.mocked(getConnection).mockReturnValue(null)
      const tool = findTool('wechat_auto_navigate')
      await expect(tool.handler({ action: 'navigateTo', url: '/test' })).rejects.toThrow('Not connected')
    })
  })
})
