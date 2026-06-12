import { describe, expect, it, vi } from 'vitest'
import { createApplicationsApi } from '../createApplicationsApi'

type TestScope = 'all' | 'active'

describe('createApplicationsApi', () => {
  it('calls apiGetJson with the correct endpoint and scope param', async () => {
    const mockGetJson = vi.fn().mockResolvedValue({
      data: [{ id: 1, name: 'App1', slug: 'app1' }],
    })
    const api = createApplicationsApi<TestScope, { id: number; name: string; slug: string }>({
      apiGetJson: mockGetJson,
    })

    const result = await api.fetchApplications('all')

    expect(mockGetJson).toHaveBeenCalledWith('applications?scope=all')
    expect(result).toEqual([{ id: 1, name: 'App1', slug: 'app1' }])
  })

  it('uses default scope of "all" when no scope is passed', async () => {
    const mockGetJson = vi.fn().mockResolvedValue({ data: [] })
    const api = createApplicationsApi<TestScope, { id: number; name: string; slug: string }>({
      apiGetJson: mockGetJson,
    })

    await api.fetchApplications()

    expect(mockGetJson).toHaveBeenCalledWith('applications?scope=all')
  })

  it('passes different scope values correctly', async () => {
    const mockGetJson = vi.fn().mockResolvedValue({ data: [] })
    const api = createApplicationsApi<TestScope, { id: number; name: string; slug: string }>({
      apiGetJson: mockGetJson,
    })

    await api.fetchApplications('active')

    expect(mockGetJson).toHaveBeenCalledWith('applications?scope=active')
  })

  it('returns an empty array when data is empty', async () => {
    const mockGetJson = vi.fn().mockResolvedValue({ data: [] })
    const api = createApplicationsApi<TestScope, { id: number; name: string; slug: string }>({
      apiGetJson: mockGetJson,
    })

    const result = await api.fetchApplications()
    expect(result).toEqual([])
  })

  it('propagates errors from apiGetJson', async () => {
    const mockGetJson = vi.fn().mockRejectedValue(new Error('Network error'))
    const api = createApplicationsApi<TestScope, { id: number; name: string; slug: string }>({
      apiGetJson: mockGetJson,
    })

    await expect(api.fetchApplications()).rejects.toThrow('Network error')
  })
})
