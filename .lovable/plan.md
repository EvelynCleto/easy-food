# EasyFood → Produto Premium

O escopo que você pediu é enorme (cliente + IA + fidelidade + gamificação + admin completo + analytics + pagamentos reais + mapa real). Para entregar com **qualidade real de startup** — e não 40 telas pela metade — vou dividir em **fases entregáveis**, cada uma 100% funcional antes da próxima. Você aprova fase a fase.

Antes de começar, **3 decisões** que mudam muito o escopo:

---

## Decisões necessárias

**1. Google Maps real**
Mapa real exige o connector Google Maps (chave gerenciada Lovable, custo do provedor). Posso:
- (a) Ativar Google Maps agora (mapa real, autocomplete de endereço, rotas)
- (b) Usar mapa estilizado com pins (sem provedor) e ativar Google depois

**2. Pagamentos**
Você listou PIX real, Stripe, Mercado Pago, Google/Apple Pay, vale-refeição. Na Lovable o suportado nativo é:
- **Stripe Payments gerenciado** (cartão, Apple/Google Pay automáticos) — recomendo
- PIX real e Mercado Pago **não** são nativos — ficariam como mock visual ou exigem integração custom posterior
- Vale-refeição (Sodexo/VR/Alelo) não tem API pública aberta — sempre será mock
Confirma: **Stripe gerenciado real + PIX/VR como mock visual**?

**3. Admin**
Admin completo (CRUD máquinas/produtos/usuários + analytics + sensores + alertas) é praticamente um segundo app. Confirma que quer **na mesma base**, atrás de role `admin`, com menu separado?

---

## Fases propostas

### Fase 1 — Fundação Premium (design system + UX base)
- Design tokens completos (cores, tipografia, spacing, radius, shadows, motion)
- Dark mode + light mode com toggle
- Skeleton/shimmer reutilizáveis, empty states, error states, toasts padronizados
- Microinterações (Framer Motion): page transitions, press states, success checks, confetti em conquistas
- Componentes base: `StatCard`, `MetricRing`, `SectionHeader`, `BottomSheet`, `Stepper`, `Timeline`
- Responsividade auditada (mobile/tablet/desktop/ultrawide) com grid + min-w-0 + truncate corretos
- Header global com saudação dinâmica + progresso nutricional do dia

### Fase 2 — Home Inteligente + Catálogo Premium
- Home: saudação, anel de progresso (kcal/proteína/água), streak, máquinas próximas, "Recomendado pra você" (IA com motivo), promoções, últimas compras
- Catálogo: busca avançada, filtros (macros, dieta, restrições), ordenação, badges, infinite scroll
- Detalhe produto: galeria + zoom, tabela nutricional completa, micros, objetivo (cutting/bulking/manutenção), reviews com fotos, cross-sell "quem comprou também", up-sell
- Reviews reais (tabela já existe) com upload de foto

### Fase 3 — Máquinas + Mapa + Pedido E2E
- Tela máquinas com mapa (Google ou estilizado conforme decisão #1)
- Detalhe da máquina: estoque por categoria, temperatura, status, próx. reposição
- Carrinho redesenhado: observações por item, resumo nutricional total, salvos
- Checkout premium com cupom, cashback, fidelidade, métodos de pagamento (Stripe real + mocks)
- QR Code dinâmico com countdown, status realtime via Supabase Realtime
- Pedidos: timeline animada, filtros, recompra 1-click, comprovante PDF, avaliação pós-retirada

### Fase 4 — IA Nutricional Avançada + Coach
- Análise de foto melhorada: múltiplos alimentos, peso estimado, score de confiança, edição manual
- Dashboard nutricional: gráficos diário/semanal/mensal/anual (kcal, macros, água, fibras)
- **Nutri Coach Chat** (streaming, AI Elements, Gemini): contexto do histórico do usuário, sugestões de produtos do catálogo
- Meta diária com check-in de água e peso

### Fase 5 — Perfil + Fidelidade + Gamificação
- Perfil dashboard: peso, altura, IMC calculado, objetivo, alvos macro, restrições, preferências, histórico de peso
- Fidelidade: níveis Bronze→Diamond, pontos por compra, cashback escalonado, cupons, benefício aniversário
- Gamificação: streak diário, conquistas (badges), missões semanais, ranking de amigos
- Notificações: central completa + realtime + preferências

### Fase 6 — Admin + Analytics
- Layout admin separado (`/admin/*`, role `admin` via `user_roles` + `has_role`)
- Dashboard executivo: receita, pedidos, ticket médio, recompra, CAC/LTV (com dados reais do banco)
- CRUD máquinas (com sensores mockados realistas: temperatura, estoque, alertas)
- CRUD produtos (categorias, preço, disponibilidade por máquina, upload imagens)
- Gestão usuários + assinaturas + fidelidade
- Analytics: receita por máquina/produto, top vendidos, horários de pico, retenção/churn, funil

### Fase 7 — Dados realistas + Polimento final
- Seed completo: 50+ produtos com fotos consistentes (geradas), 15+ máquinas em SP/RJ com endereços reais, 200+ pedidos históricos, reviews realistas, usuários demo, estoque dinâmico coerente
- Auditoria de performance (lazy load, code split por rota)
- Auditoria de acessibilidade (contraste, foco, ARIA)
- Auditoria responsiva em viewports reais via Playwright
- SEO + meta tags + PWA manifest

---

## Como prossigo

Responda:
1. **Maps**: (a) Google real agora ou (b) estilizado por enquanto?
2. **Pagamentos**: confirma Stripe gerenciado real + PIX/VR mock visual?
3. **Admin**: mesma base com role `admin`, ok?
4. **Por onde começo**: Fase 1 (recomendado) ou pular direto pra alguma específica?

Assim que confirmar, executo a Fase 1 inteira nesta sessão e te mostro pronta antes de seguir.
