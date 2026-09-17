import { describe, expect, it } from 'vitest'
import { prepareBindValues } from '@livestore/livestore'

/**
 * Pins the bind-value contract of LiveStore's query layer.
 *
 * Production code binds raw-SQL `?` placeholders. `prepareBindValues` passes
 * arrays through untouched (positional), but maps object-form keys to `$key`
 * NAMED parameters, keeping only keys whose text occurs anywhere in the SQL
 * string. Object binds therefore can never feed positional placeholders:
 * surviving keys bind as named params against `?` (a mismatch), and the rest
 * are silently dropped. This bit us once (filtered collection views silently
 * matched nothing until 8e30a2b1 switched to array binds); this spec makes a
 * LiveStore upgrade that changes the semantics fail loudly instead of
 * silently emptying every filtered view.
 */
describe('LiveStore prepareBindValues contract', () => {
  it('passes array binds through unchanged (positional placeholders)', () => {
    const binds = ['%term%', 'a1']
    expect(prepareBindValues(binds, 'SELECT 1 WHERE x LIKE ? AND y = ?')).toBe(binds)
  })

  it('renames object keys to $key named params', () => {
    expect(prepareBindValues({ title: 'x' }, 'SELECT 1 WHERE title = $title')).toEqual({
      $title: 'x',
    })
  })

  it('drops object keys whose text occurs nowhere in the SQL', () => {
    expect(prepareBindValues({ zz9: 'x' }, 'SELECT m.id FROM media m WHERE title = ?')).toEqual({})
  })

  it('object keys become named params, never positional binds', () => {
    // Key "1" survives only because the SQL contains a literal "1" (LIMIT 10),
    // and it binds as the NAMED param $1 — not the positional ?. Numeric-keyed
    // objects are unusable with `?` placeholders either way.
    expect(prepareBindValues({ 1: 'x' }, 'SELECT m.id FROM media m LIMIT 10')).toEqual({ $1: 'x' })
  })
})
