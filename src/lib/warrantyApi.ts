/**
 * Warranty API client - handles warranty claims and operations
 */

import { api } from './apiClient'

export const warrantyApi = {
  /**
   * Submit a new warranty claim with evidence file
   */
  submitClaim: async (data: {
    order_id: string
    order_item_id: string
    reason: string
    evidence: File
  }) => {
    const formData = new FormData()
    formData.append('order_id', data.order_id)
    formData.append('order_item_id', data.order_item_id)
    formData.append('reason', data.reason)
    formData.append('evidence', data.evidence)

    return api.postForm('/api/warranty/claims', formData)
  },

  /**
   * สินค้าที่เคลมได้จริง (server คิดให้: จ่ายแล้ว + มีประกัน + ยังไม่หมดอายุ + ยังไม่เคยเคลม)
   */
  eligibleItems: async () => api.get('/api/warranty/eligible-items'),

  /**
   * List user's warranty claims
   */
  listClaims: async (filters?: {
    status?: string
    limit?: number
    offset?: number
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    return api.get(`/api/warranty/claims${params.toString() ? '?' + params.toString() : ''}`)
  },

  /**
   * Get warranty claim details
   */
  getClaim: async (id: string) => {
    return api.get(`/api/warranty/claims/${id}`)
  },

  /**
   * Get product warranty information
   */
  getProductWarranty: async (productId: string) => {
    return api.get(`/api/products/${productId}/warranty`)
  },
}

/**
 * Admin warranty API client
 */
export const adminWarrantyApi = {
  /**
   * List all warranty claims (admin only)
   */
  listAllClaims: async (filters?: {
    status?: string
    product_id?: string
    user_id?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
    sort?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.product_id) params.append('product_id', filters.product_id)
    if (filters?.user_id) params.append('user_id', filters.user_id)
    if (filters?.date_from) params.append('date_from', filters.date_from)
    if (filters?.date_to) params.append('date_to', filters.date_to)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.sort) params.append('sort', filters.sort)

    return api.get(`/api/admin/warranty-claims${params.toString() ? '?' + params.toString() : ''}`)
  },

  /**
   * Update warranty claim status (admin only)
   */
  updateClaim: async (id: string, data: {
    status?: 'pending' | 'approved' | 'rejected' | 'processed'
    admin_notes?: string
  }) => {
    return api.patch(`/api/warranty/claims/${id}`, data)
  },
}
