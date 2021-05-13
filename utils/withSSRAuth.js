import decode from 'jwt-decode'
import { parseCookies, destroyCookie } from 'nookies'
import { AuthTokenError } from '../services/errors/AuthTokenError'
import {validateUserPermissions} from '../utils/validateUserPermissions'

export function withSSRAuth(fn, options) {
  return async (ctx) => {
    const cookies = parseCookies(ctx)
    const token = cookies['nextauth.token']

    if(!token){
      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    }

    if(options){
      const user = decode(token)
      const { permissions, roles } = options
  
      const userHasValidPermissions = validateUserPermissions({
        user,
        permissions,
        roles
      })

      if(!userHasValidPermissions){
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          }
        }
      }
    }

    try {
      return await fn(ctx)
    } catch (err) { 
      if(err instanceof AuthTokenError) {
        destroyCookie(ctx, 'nextauth.token')
        destroyCookie(ctx, 'nextauth.refreshToken')
        return {
          redirect: {
            destination: '/',
            permanent: false
          }
        }
      }
    }
  }
}