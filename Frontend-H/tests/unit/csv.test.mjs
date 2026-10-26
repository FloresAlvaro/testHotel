import { test } from 'node:test'
import assert from 'node:assert/strict'
import { serializeCsv } from '../../app/utils/csv.ts'

test('los nombres con fórmulas y controles se exportan como texto', () => {
  for (const value of ['=1+1', '+1+1', '-1+1', '@SUM(1)', '  =1+1', '\t=1+1', '\n=1+1', '\r+1', '\uFEFF=1', '\ttexto']) {
    assert.equal(serializeCsv([[value]]), `"'${value}"`)
  }
})
test('conserva números, Unicode, comillas y separadores', () => {
  assert.equal(serializeCsv([['José, "A"', -12.5, 0, null, true], ['Pérez', 'normal']]), '"José, ""A""","-12.5","0","","true"\r\n"Pérez","normal"')
})
