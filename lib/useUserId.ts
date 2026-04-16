'use client'

import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function useUserId(): string {
  const [userId, setUserId] = useState('')

  useEffect(() => {
    let id = localStorage.getItem('dieta_user_id')
    if (!id) {
      id = uuidv4()
      localStorage.setItem('dieta_user_id', id)
    }
    setUserId(id)
  }, [])

  return userId
}
