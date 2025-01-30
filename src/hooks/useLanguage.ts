import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { setLocale } from 'react-redux-i18n'
import { useDispatch } from 'react-redux'
import LanguageDetector from '../services/language/LanguageDetector'
import type { State } from '../reducers/settings'
import type { Dispatch, Action } from 'redux'

export const useLanguage = () => {
  const dispatch = useDispatch<Dispatch>()
  const settings = useSelector((state: { settings: State }) => state.settings.settings)
  
  useEffect(() => {
    const language = settings.app.language
    const selectedLanguage = language.useSystemLanguage 
      ? LanguageDetector.getPreferredLanguage()
      : language.code

    dispatch(setLocale(selectedLanguage) as unknown as Action)
  }, [
    settings.app.language.useSystemLanguage,
    settings.app.language.code,
    dispatch
  ])
} 
