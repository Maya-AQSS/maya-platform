/**
 * Deep merge para resource bundles de i18next.
 *
 * El spread superficial `{ ...canon, ...local }` REEMPLAZA objetos enteros en
 * caso de colisión a nivel top — si tanto canon como local definen `nav: {...}`,
 * el local borra las keys del canon dentro de `nav`. Esto rompía `t('nav.dashboard')`
 * cuando el local solo definía `nav.brand`.
 *
 * Reglas:
 * - Objetos plain: merge recursivo, local gana en colisión de leaf.
 * - Arrays / primitivos / null: local sustituye a canon.
 * - Otros tipos (Date, Set, etc.) no aparecen en JSON bundles, no se manejan.
 */

type JSONValue = string | number | boolean | null | JSONObject | JSONValue[]
interface JSONObject { [k: string]: JSONValue }

function isPlainObject(v: unknown): v is JSONObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function deepMerge<T extends JSONObject>(canon: T, local: Partial<T>): T {
  const out: JSONObject = { ...canon }
  for (const key of Object.keys(local)) {
    const cv = out[key]
    const lv = (local as JSONObject)[key]
    if (isPlainObject(cv) && isPlainObject(lv)) {
      out[key] = deepMerge(cv, lv)
    } else {
      out[key] = lv
    }
  }
  return out as T
}
