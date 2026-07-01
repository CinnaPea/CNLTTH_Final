import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { API_BASE_URLS } from '../../api/client'
import { setActiveBackend } from '../../api/backendProvider'
import { examEndpoints } from '../../api/examEndpoints'
import { csharpEndpoints } from '../../api/csharpEndpoints'
import { rubyEndpoints } from '../../api/rubyEndpoints'
import { server } from '../mocks/server'

describe('examEndpoints failover shape', () => {
  it('keeps Ruby and C# endpoint wrappers in parity', () => {
    expect(Object.keys(csharpEndpoints).sort()).toEqual(Object.keys(rubyEndpoints).sort())
  })

  it('exposes every backend action through the shared failover facade', () => {
    Object.keys(rubyEndpoints).forEach((action) => {
      expect(examEndpoints[action]).toEqual(expect.any(Function))
    })
  })

  it('reads from the active Ruby provider', async () => {
    setActiveBackend('ruby')

    const subjects = await examEndpoints.getMonThi()

    expect(subjects).toEqual(expect.arrayContaining([
      expect.objectContaining({ MaMon: 'CSDL' }),
    ]))
  })

  it('falls back from Ruby to C# for safe reads', async () => {
    setActiveBackend('ruby')
    server.use(
      http.get(`${API_BASE_URLS.ruby}/ky_thi`, () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    )

    const exams = await examEndpoints.getKyThis()

    expect(exams[0]).toEqual(expect.objectContaining({ MaKyThi: 'KT001' }))
  })

  it('blocks mutating failover retries', async () => {
    setActiveBackend('ruby')
    server.use(
      http.patch(`${API_BASE_URLS.ruby}/diem_danh/:id`, () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    )

    await expect(examEndpoints.updateDiemDanh(1, { TrangThai: 'present' }))
      .rejects.toThrow(/Write failover was blocked/)
  })

  it('blocks create failover retries to avoid duplicate SQL writes', async () => {
    setActiveBackend('ruby')
    server.use(
      http.post(`${API_BASE_URLS.ruby}/dang_ky_thi`, () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    )

    await expect(examEndpoints.createDangKy({ KyThiID: 1, SinhVienID: 2 }))
      .rejects.toThrow(/Write failover was blocked/)
  })

  it('adds an idempotency key header to write requests', async () => {
    setActiveBackend('ruby')
    let idempotencyKey = ''

    server.use(
      http.post(`${API_BASE_URLS.ruby}/mon_thi`, async ({ request }) => {
        idempotencyKey = request.headers.get('Idempotency-Key') || ''
        const body = await request.json()
        return HttpResponse.json({ MonThiID: 77, ...body.mon_thi }, { status: 201 })
      }),
    )

    await examEndpoints.createMonThi({ MaMon: 'ATBM', TenMon: 'An toan bao mat' })

    expect(idempotencyKey).toMatch(/^examflow-/)
  })
})
