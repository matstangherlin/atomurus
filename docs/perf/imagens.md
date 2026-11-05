# Imagens responsivas (opcional)

`tools/optimize-images.mjs` prepara WebP e AVIF ao lado do original. Não entra no site até alguém decidir usar a imagem (herói, macro) e apontar o HTML para ela. O padrão é **dry-run**: lista o que faria e não grava nada.

```bash
node tools/optimize-images.mjs --dir assets/concepts
node tools/optimize-images.mjs --dir assets/concepts --write
```

Larguras: 480, 960 e 1600. Se o original for mais estreito, a largura maior é pulada (não amplia). O original não é apagado nem renomeado.

Codificador, nesta ordem:

1. `sharp`, se `import('sharp')` funcionar. Gera `.webp` e `.avif`.
2. Senão, o binário `cwebp` (só WebP, com `-resize`).
3. Se nenhum dos dois existir, o script imprime como instalar e termina com código 0.

Não adicione `sharp` ao `package.json`. Para uma corrida avulsa:

```bash
npx --yes -p sharp node tools/optimize-images.mjs --dir assets/concepts --write
```

`avifenc` sozinho não redimensiona; o AVIF responsivo fica a cargo do `sharp`.

## Snippet para uso futuro

Troque `foto` pelo nome do arquivo, e `width`/`height` pelas dimensões reais do original. Não está ligado a nenhuma página pública.

```html
<picture>
  <source
    type="image/avif"
    srcset="foto-480.avif 480w, foto-960.avif 960w, foto-1600.avif 1600w"
    sizes="(max-width: 600px) 100vw, 960px">
  <source
    type="image/webp"
    srcset="foto-480.webp 480w, foto-960.webp 960w, foto-1600.webp 1600w"
    sizes="(max-width: 600px) 100vw, 960px">
  <img src="foto.jpg" width="1600" height="900" alt="" loading="lazy" decoding="async">
</picture>
```

O que saiu do publish neste prompt está em `docs/perf/imagens-inventario.md`.
