# Project glossary

Canonical English names for the domain. Every class, enum, table, column and API field uses these names. The Spanish source terms are kept here only as history.

## Classes

| Source (Spanish) | English |
|---|---|
| Atleta | Athlete |
| Inscripcion | Registration |
| Evento | Event |
| Modalidad | Modality |
| Kit | Kit |
| ItemKit | KitItem |
| Talla | Size |
| TramoPrecio | PriceTier |
| Campania | Campaign |
| CategoriaEdad | AgeCategory |
| PlantillaCategoria | AgeCategoryTemplate |
| Marca | Brand |
| Usuario | User |
| Pago | Payment |
| Idioma | Language |
| Segmento | Segment |
| ConfiguracionSistema | SystemSettings |
| ConversacionWhatsApp | WhatsAppConversation |
| MensajeWhatsApp | WhatsAppMessage |
| MensajeCampania | CampaignMessage |
| CuentaAtleta | AthleteAccount |
| EntregaKit | KitDelivery |
| EquivalenciaModalidad | ModalityEquivalence |
| LoteImportacionAtletas | AthleteImportBatch |
| FilaImportacionAtleta | AthleteImportRow |
| LoteImportacionExtracto | StatementImportBatch |
| MovimientoExtracto | StatementMovement |
| MovimientoMoneySport | MoneySportMovement |
| QrCobro | PaymentQrCode |
| RegistroAuditoria | AuditRecord |

## Enums

| Source (Spanish) | English | Values |
|---|---|---|
| EstadoInscripcion | RegistrationStatus | Borrador→Draft, Pendiente→Pending, Pagada→Paid, Observada→UnderReview, Expirada→Expired, Anulada→Cancelled, Reembolsada→Refunded |
| EstadoEvento | EventStatus | Borrador→Draft, Publicado→Published, Cerrado→Closed, Finalizado→Finished, Cancelado→Cancelled |
| EstadoCampania | CampaignStatus | Borrador→Draft, Programada→Scheduled, Enviando→Sending, Enviada→Sent, Cancelada→Cancelled |
| EstadoConciliacion | ReconciliationStatus | Pendiente→Pending, ConciliadoAutomatico→AutoReconciled, ConciliadoSugerido→Suggested, ConciliadoManual→ManuallyReconciled, Descartado→Discarded |
| EstadoMensaje | MessageStatus | Pendiente→Pending, Enviado→Sent, Entregado→Delivered, Leido→Read, Fallido→Failed |
| TipoDocumento | DocumentType | Ci→Ci, Dni→Dni, Pasaporte→Passport, CarneExtranjeria→ForeignerId, Rut→Rut, Cpf→Cpf, Otro→Other |
| TipoPrenda | GarmentType | Polera→TShirt, Malla→Singlet (to confirm) |
| Sexo | Sex | Femenino→Female, Masculino→Male |
| OrigenOptIn | OptInSource | Formulario→Form, Importado→Imported, Manual→Manual |
| OrigenPago | PaymentSource | Extracto→Statement, Comprobante→Receipt, Manual→Manual, Webhook→Webhook |
| ReglaConciliacion | ReconciliationRule | Ninguna→None, NumeroTransaccion→TransactionNumber, MontoYOrdenante→AmountAndPayer, Manual→Manual |
| ResultadoFilaImportacion | ImportRowResult | Aceptada→Accepted, Corregida→Corrected, EnRevision→InReview, Duplicada→Duplicate, Rechazada→Rejected |
| ResultadoParticipacion | ParticipationResult | Finalizo→Finished, Abandono→Dropped, NoSePresento→NoShow |
| RolUsuario | UserRole | Admin→Admin, Cajero→Cashier, StaffKits→KitStaff, SoloLectura→ReadOnly |
| DireccionMensaje | MessageDirection | Entrante→Inbound, Saliente→Outbound |
| TipoContenidoWhatsApp | WhatsAppContentType | Texto→Text, Imagen→Image, Audio→Audio, Video→Video, Documento→Document, Sticker→Sticker, Ubicacion→Location, Contacto→Contact, Reaccion→Reaction, Boton→Button, Plantilla→Template, NoSoportado→Unsupported |
| TipoMovimientoMoneySport | MoneySportMovementType | Abono→Credit, Uso→Debit |

## Tables

| Source (Spanish) | English |
|---|---|
| Atletas | Athletes |
| Auditoria | AuditRecords |
| Campanias | Campaigns |
| Categorias | AgeCategories |
| Configuracion | Settings |
| ConversacionesWhatsApp | WhatsAppConversations |
| CuentasAtleta | AthleteAccounts |
| EntregasKit | KitDeliveries |
| EquivalenciasModalidad | ModalityEquivalences |
| Eventos | Events |
| FilasImportacion | AthleteImportRows |
| Idiomas | Languages |
| Inscripciones | Registrations |
| ItemsKit | KitItems |
| KitItems | KitComposition |
| Kits | Kits |
| LotesAtletas | AthleteImportBatches |
| LotesExtracto | StatementImportBatches |
| Marcas | Brands |
| MensajesCampania | CampaignMessages |
| MensajesWhatsApp | WhatsAppMessages |
| Modalidades | Modalities |
| MovimientosExtracto | StatementMovements |
| MovimientosMoneySport | MoneySportMovements |
| Pagos | Payments |
| PlantillasCategorias | AgeCategoryTemplates |
| QrCobros | PaymentQrCodes |
| Segmentos | Segments |
| Tallas | Sizes |
| TramosPrecio | PriceTiers |
| Usuarios | Users |

## Columns and constraint parts

| Source (Spanish) | English |
|---|---|
| AceptoDeslinde | WaiverAccepted |
| Activa | Active |
| Activo | Active |
| Alergias | Allergies |
| Apellidos | LastNames |
| AperturaInscripciones | RegistrationOpensAt |
| Archivada | Archived |
| AsuntoProveedor | ProviderSubject |
| AtletaDuplicadoId | DuplicateAthleteId |
| AtletaId | AthleteId |
| BancoOrigen | SourceBank |
| BloqueadaHasta | LockedUntil |
| Cambios | Changes |
| CampaniaId | CampaignId |
| CanalCaptacion | AcquisitionChannel |
| CategoriaId | AgeCategoryId |
| Celular | Phone |
| CelularCodigoPais | PhoneCountryCode |
| CelularE164 | PhoneE164 |
| CelularNumero | PhoneNumber |
| CelularOriginal | PhoneOriginal |
| CierreCambioTalla | SizeChangeClosesAt |
| CierreInscripciones | RegistrationClosesAt |
| Ciudad | City |
| Club | Club |
| Codigo | Code |
| CodigoReferido | ReferralCode |
| ContactoEmergenciaNombre | EmergencyContactName |
| ContactoEmergenciaTelefonoCodigoPais | EmergencyContactPhoneCountryCode |
| ContactoEmergenciaTelefonoNumero | EmergencyContactPhoneNumber |
| ConversacionId | ConversationId |
| CreadaPorUsuarioId | CreatedByUserId |
| CreadoPorUsuarioId | CreatedByUserId |
| Cuerpo | Body |
| CuerpoRenderizado | RenderedBody |
| Cupo | Quota |
| DatosOrigen | SourceData |
| Descripcion | Description |
| DescuentoMoneySportCentavos | MoneySportDiscountCents |
| Detalle | Detail |
| Direccion | Direction |
| DistanciaMetros | DistanceMeters |
| Dorsal | BibNumber |
| DorsalDesde | BibFrom |
| DorsalHasta | BibTo |
| EdadMaxima | MaxAge |
| EdadMinima | MinAge |
| Email | Email |
| Encabezado | Header |
| EncabezadoMediaUrl | HeaderMediaUrl |
| EncabezadoRenderizado | RenderedHeader |
| EnviadoPorUsuarioId | SentByUserId |
| Error | Error |
| EsCortesia | IsComplimentary |
| Estado | Status |
| EventoId | EventId |
| ExcedenteCentavos | SurplusCents |
| Fecha | Date |
| FechaAcreditacion | CreditedAt |
| FechaActualizacion | UpdatedAt |
| FechaBaja | UnsubscribedAt |
| FechaCreacion | CreatedAt |
| FechaDeslinde | WaiverAcceptedAt |
| FechaEntrega | DeliveredAt |
| FechaEnvio | SentAt |
| FechaEvento | EventDate |
| FechaExpiracion | ReservationExpiresAt |
| FechaImportacion | ImportedAt |
| FechaMensaje | MessageAt |
| FechaMovimiento | MovementDate |
| FechaNacimiento | BirthDate |
| FechaOptIn | MarketingOptInAt |
| FechaPago | PaidAt |
| FechaProgramada | ScheduledAt |
| FechaRegistro | RecordedAt |
| FechaResultado | ResultAt |
| FechaUltimoAcceso | LastAccessAt |
| FilaOriginal | RawRow |
| FilasAceptadas | RowsAccepted |
| FilasCorregidas | RowsCorrected |
| FilasDuplicadas | RowsDuplicated |
| FilasEnRevision | RowsInReview |
| FilasIgnoradas | RowsIgnored |
| FilasImportadas | RowsImported |
| FilasLeidas | RowsRead |
| FilasRechazadas | RowsRejected |
| FiltroJson | FilterJson |
| Glosa | Memo |
| HashPassword | PasswordHash |
| HorasVigenciaReserva | ReservationHours |
| HorasVigenciaReservaPorDefecto | DefaultReservationHours |
| Id | Id |
| IdExterno | ExternalId |
| IdExternoRespondido | ExternalRepliedId |
| IdiomaPlantilla | TemplateLanguage |
| IdiomaPreferido | PreferredLanguage |
| ImagenEncabezadoUrl | HeaderImageUrl |
| InscripcionId | RegistrationId |
| InscripcionSugeridaId | SuggestedRegistrationId |
| Intentos | Attempts |
| IntentosDescarga | DownloadAttempts |
| IntentosVinculacion | LinkAttempts |
| Ip | IpAddress |
| IpDeslinde | WaiverIp |
| ItemsId | KitItemId |
| KitId | KitId |
| KitsId | KitId |
| LoteId | BatchId |
| LoteImportacionId | StatementBatchId |
| Lugar | Location |
| MapeoJson | MappingJson |
| MarcaId | BrandId |
| MediaDescargado | MediaDownloaded |
| MediaIdMeta | MediaMetaId |
| MediaMimeType | MediaMimeType |
| MediaNombreArchivo | MediaFileName |
| MediaRutaArchivo | MediaFilePath |
| MediaTamanoBytes | MediaSizeBytes |
| Medida | Measure |
| ModalidadId | ModalityId |
| MontoCentavos | AmountCents |
| MontoMoneySportCentavos | MoneySportAmountCents |
| MontoServicioCentavos | ServiceFeeCents |
| MotivoDescarte | DiscardReason |
| Nacionalidad | Nationality |
| NoLeidos | UnreadCount |
| Nombre | Name |
| NombreArchivo | FileName |
| NombreManualCorredor | RunnerManualName |
| NombreOrdenante | PayerName |
| NombreOrganizacion | OrganizationName |
| NombrePerfil | ProfileName |
| NombrePlantilla | TemplateName |
| Nombres | FirstNames |
| NombreUsuario | LoginName |
| NumeroDocumento | DocumentNumber |
| NumeroDocumentoOriginal | DocumentNumberOriginal |
| NumeroFila | RowNumber |
| NumeroTransaccion | TransactionNumber |
| Observaciones | Notes |
| Operacion | Operation |
| OptInMarketing | MarketingOptIn |
| OrigenOptIn | OptInSource |
| Orden | SortOrder |
| Origen | Source |
| ParametrosEncabezadoJson | HeaderParametersJson |
| ParametrosJson | ParametersJson |
| PagoId | PaymentId |
| PerfilBanco | BankProfile |
| PrecioCentavos | PriceCents |
| Proveedor | Provider |
| PuntajeSugerencia | SuggestionScore |
| PuntoEntrega | PickupPoint |
| RecargoCentavos | SurchargeCents |
| RegistradoPorUsuarioId | RecordedByUserId |
| RegistroId | RecordId |
| Regla | Rule |
| Resultado | Result |
| RetiradoPor | PickedUpBy |
| Rol | Role |
| RutaComprobante | ReceiptPath |
| RutaImagen | ImagePath |
| RutaManualCorredor | RunnerManualPath |
| RutaQrGenerico | GenericQrPath |
| Segmentos | Segments |
| Sexo | Sex |
| Slug | Slug |
| Tabla | TableName |
| TallaId | SizeId |
| Texto | Text |
| TextoDeslinde | WaiverText |
| TextoDeslindePorDefecto | DefaultWaiverText |
| TextoOrigen | SourceText |
| Tipo | Type |
| TipoContenido | ContentType |
| TipoDocumento | DocumentType |
| TipoSangre | BloodType |
| TipoTallaRequerida | RequiredSizeType |
| ToleranciaPagoCentavos | PaymentToleranceCents |
| ToleranciaPagoCentavosPorDefecto | DefaultPaymentToleranceCents |
| TramoPrecioId | PriceTierId |
| UltimoAcceso | LastAccessAt |
| UltimoError | LastError |
| UltimoMensajeEn | LastMessageAt |
| UltimoMensajeEntranteEn | LastInboundMessageAt |
| UltimoMensajeResumen | LastMessageSummary |
| UsuarioId | UserId |
| UsuarioNombre | UserName |
| VigenteDesde | ValidFrom |
| VigenteHasta | ValidTo |
| WaId | WaId |
| Lugar | Location |
| WhatsApp | WhatsApp |
| Media | Media |
