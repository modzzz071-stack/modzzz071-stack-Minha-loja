# VAULT STORE

Loja de produtos digitais em português (BRL), hospedada na Netlify, com checkout Stripe e entrega protegida.

## Estrutura

```
Minha-loja/
├── index.html                  vitrine + carrinho + checkout + páginas de retorno
├── netlify.toml                build, diretório de funções e headers de segurança
├── package.json                dependências das funções (stripe, @netlify/blobs)
├── README.md
├── netlify/functions/
│   ├── _products.mjs           catálogo canônico — preços SEMPRE daqui, nunca do navegador
│   ├── _orders.mjs             persistência de pedidos/eventos no Netlify Blobs
│   ├── create-checkout.mjs     valida itens, cria sessão Stripe em BRL
│   ├── stripe-webhook.mjs      verifica assinatura, idempotente, marca pedido como pago
│   ├── order-status.mjs        consulta do pedido para a página de retorno (polling)
│   └── download.mjs            entrega protegida (só pedido pago, limite de 5 downloads)
└── scripts/
    └── upload-product-files.mjs  sobe os arquivos dos produtos para o Blobs privado
```

## Configuração (passo a passo pelo iPhone)

### 1. Subir os arquivos no GitHub

No app GitHub (ou pelo navegador), abra o repositório `Minha-loja` e substitua/cole:
`index.html`, `netlify.toml`, `package.json`, `README.md` e as pastas `netlify/functions/` e `scripts/`.

### 2. Variáveis de ambiente na Netlify

Netlify → seu site → **Site settings → Environment variables**, adicione:

| Variável | Onde pegar |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → **Secret key** (modo Teste) |
| `STRIPE_WEBHOOK_SECRET` | criada no passo 3 abaixo |

Nunca cole esses valores no chat, no código ou em print público.

### 3. Webhook no Stripe

Stripe Dashboard → Developers → Webhooks → **Add endpoint**:

- URL: `https://marvelous-squirrel-ba7c5d.netlify.app/.netlify/functions/stripe-webhook`
- Eventos: `checkout.session.completed` e `checkout.session.expired`

Depois de criar, clique no endpoint → **Signing secret** → copie e cole na variável
`STRIPE_WEBHOOK_SECRET` da Netlify.

### 4. Deploy

O Netlify faz deploy automático a cada push no GitHub. Confira em **Deploys** que o build
terminou e as 4 funções aparecem em **Functions**.

## Testes (modo Teste do Stripe — nunca cobrança real)

Cartão de teste oficial: `4242 4242 4242 4242`, qualquer validade futura, qualquer CEP/CVC.

1. Abra a loja, adicione produtos, mude quantidades, remova itens, confira o total.
2. Finalize — você deve ir para a página do Stripe. Pague com o cartão de teste.
3. Ao voltar, a página mostra "Confirmando seu pagamento" e depois libera os downloads.
4. Teste também: **voltar sem pagar** (botão de voltar do Stripe) → mensagem de cancelamento, carrinho preservado.
5. Teste no celular e no modo anônimo.

## Arquivos dos produtos (entrega)

Os produtos vêm sem arquivo (`file: null`) de propósito — não inventamos arquivos. Para ativar a entrega de cada produto:

- **Opção A (blobs privado):** rode `node scripts/upload-product-files.mjs` (ver comentário no
  topo do script) e troque em `_products.mjs`:
  `file: null` → `file: { type: 'blob', key: 'tpl-social' }`
- **Opção B (arquivo externo):** `file: { type: 'url', url: 'https://seu-link-restrito' }`
  (ex.: link de download direto do Drive com acesso restrito).

Enquanto `file` for `null`, o download responde `delivery_not_configured` — o pedido fica pago
e registrado, só falta anexar o arquivo.

## Notas de segurança

- Preço é calculado no servidor a partir de `_products.mjs`; o navegador só manda id + quantidade.
- Webhook exige assinatura válida e descarta eventos duplicados.
- Pedido só vira `paid` pelo webhook (`payment_status === 'paid'`), nunca pela página de sucesso.
- Download exige pedido pago + item no pedido + limite de 5 por produto.
- Chaves só existem como variáveis de ambiente. Se alguma chave vazou em algum lugar, revogue e gere outra no Stripe.
