import type { DocumentType } from '@/api/types'

/**
 * Order of the document-type selector. The labels are user-visible and come from the i18n files
 * (`publicPage.documentTypes.*`), because some of them are translated (passport, foreigner ID).
 */
export const DOCUMENT_TYPES: DocumentType[] = ['Ci', 'Dni', 'Passport', 'ForeignerId', 'Rut', 'Cpf', 'Other']
