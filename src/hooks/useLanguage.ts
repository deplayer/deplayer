import { useEffect } from 'react'
import { setLocale } from 'react-redux-i18n'
import { useDispatch } from 'react-redux'
import LanguageDetector from '../services/language/LanguageDetector'
import type { Dispatch, Action } from 'redux'
import { useSettings } from '../stores/livestore/hooks'

export const useLanguage = () => {
  const dispatch = useDispatch<Dispatch>()
  const settings = useSettings()
  
  useEffect(() => {
    // Default to system language if settings structure is incomplete
    const useSystemLanguage = settings?.app?.language?.useSystemLanguage ?? true
    const languageCode = settings?.app?.language?.code ?? 'en'
    
    const selectedLanguage = useSystemLanguage 
      ? LanguageDetector.getPreferredLanguage()
      : languageCode

    dispatch(setLocale(selectedLanguage) as unknown as Action)
  }, [
    settings?.app?.language?.useSystemLanguage,
    settings?.app?.language?.code,
    dispatch
  ])
} 
