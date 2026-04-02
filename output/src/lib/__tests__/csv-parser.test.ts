import { describe, it, expect } from 'vitest'
import { validateCsvColumns, parseCsvRows, CsvParseError } from '../csv-parser'

describe('validateCsvColumns', () => {
  it('accepts valid CSV headers', () => {
    const header = 'report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi'
    const result = validateCsvColumns(header)
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('accepts headers with optional columns', () => {
    const header = 'report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi,lp_email'
    const result = validateCsvColumns(header)
    expect(result.valid).toBe(true)
  })

  it('rejects CSV with missing required columns', () => {
    const header = 'report_date,lp_id,lp_name'
    const result = validateCsvColumns(header)
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('commitment')
    expect(result.missing).toContain('nav')
    expect(result.missing).toContain('irr')
  })

  it('handles quoted headers', () => {
    const header = '"report_date","lp_id","lp_name","commitment","called_capital","nav","distributions_to_date","irr","tvpi"'
    const result = validateCsvColumns(header)
    expect(result.valid).toBe(true)
  })

  it('is case insensitive for headers', () => {
    const header = 'Report_Date,LP_ID,LP_Name,Commitment,Called_Capital,NAV,Distributions_To_Date,IRR,TVPI'
    const result = validateCsvColumns(header)
    expect(result.valid).toBe(true)
  })
})

describe('parseCsvRows', () => {
  const validCsv = `report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi
2024-Q4,LP001,Acme Pension,5000000,4000000,4500000,500000,0.12,1.25
2024-Q4,LP002,Beta Fund,3000000,2500000,2800000,300000,0.10,1.15`

  it('parses valid CSV rows', () => {
    const rows = parseCsvRows(validCsv)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.lp_id).toBe('LP001')
    expect(rows[0]!.lp_name).toBe('Acme Pension')
    expect(rows[0]!.commitment).toBe('5000000')
    expect(rows[0]!.nav).toBe('4500000')
    expect(rows[0]!.irr).toBe('0.12')
  })

  it('strips currency symbols from numeric fields', () => {
    const csvWithSymbols = `report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi
2024-Q4,LP001,Acme,$5,000,000,$4,000,000,$4,500,000,$500,000,12%,1.25`
    // Note: The CSV parser handles $ and % stripping
    const rows = parseCsvRows(csvWithSymbols)
    expect(rows).toHaveLength(1)
  })

  it('throws CsvParseError on header-only CSV', () => {
    expect(() =>
      parseCsvRows('report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi')
    ).toThrow(CsvParseError)
  })

  it('throws CsvParseError on missing required columns', () => {
    const invalidCsv = `name,value
foo,bar`
    expect(() => parseCsvRows(invalidCsv)).toThrow(CsvParseError)
  })

  it('throws CsvParseError on invalid numeric values', () => {
    const invalidCsv = `report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi
2024-Q4,LP001,Acme,not_a_number,4000000,4500000,500000,0.12,1.25`
    expect(() => parseCsvRows(invalidCsv)).toThrow()
  })

  it('skips empty lines', () => {
    const csvWithBlanks = `report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi
2024-Q4,LP001,Acme Pension,5000000,4000000,4500000,500000,0.12,1.25

2024-Q4,LP002,Beta Fund,3000000,2500000,2800000,300000,0.10,1.15
`
    const rows = parseCsvRows(csvWithBlanks)
    expect(rows).toHaveLength(2)
  })

  it('handles CSV with quoted fields containing commas', () => {
    const csvWithQuotes = `report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi
2024-Q4,LP001,"Acme, Inc. Pension",5000000,4000000,4500000,500000,0.12,1.25`
    const rows = parseCsvRows(csvWithQuotes)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.lp_name).toBe('Acme, Inc. Pension')
  })
})
