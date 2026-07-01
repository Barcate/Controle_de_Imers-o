# Controle de Imersao

Aplicativo desktop local para controlar uma maquina baseada em impressora 3D que executa ciclos de descida, espera, subida e deslocamento por pontos X/Y.

## Como rodar

```bash
npm install
npm run setup:python
npm run dev
```

O envio para a maquina usa Python com `Printrun`/`printcore`, conforme a biblioteca indicada pelo cliente:

```python
from printrun.printcore import printcore
from printrun import gcoder
```

No Linux, o comando `npm run setup:python` usa `python3`. No Windows, use `npm run setup:python:win`. Se o Python estiver em outro caminho, configure `PYTHON_PATH` antes de abrir o app.

## Como gerar instalador Windows

```bash
npm run build
npm run dist:win
```

## Como gerar instalador Linux

### Sem ter Linux local

O projeto ja tem um GitHub Actions em `.github/workflows/build-linux.yml`.

Fluxo:

1. Suba este projeto para um repositorio no GitHub.
2. Abra a aba `Actions`.
3. Selecione `Build Linux installer`.
4. Clique em `Run workflow`.
5. No final, baixe o artefato `controle-de-imersao-linux`.

Esse processo gera:

- `.AppImage`
- `.deb`

O build do Actions tambem empacota a ponte Python `printcore_bridge` como binario Linux usando PyInstaller. Assim o cliente nao precisa instalar Python ou Printrun manualmente para abrir o app.

### Em uma maquina Linux

Se alguem for gerar localmente em Linux, rode:

```bash
npm install
npm run dist:linux:full
```

Os arquivos saem na pasta `release/`.

Formatos gerados:

- `.AppImage`: executavel portatil.
- `.deb`: pacote instalavel em Debian/Ubuntu.

Para rodar o AppImage, pode ser necessario marcar como executavel uma vez:

```bash
chmod +x release/*.AppImage
./release/*.AppImage
```

Para instalar o `.deb`, o cliente pode dar dois cliques no arquivo em muitas distribuicoes. Pelo terminal:

```bash
sudo apt install ./release/*.deb
```

Em Linux, o usuario pode precisar de permissao para acessar a porta serial:

```bash
sudo usermod -aG dialout $USER
```

Depois disso, saia e entre de novo na sessao do sistema.

## Rotina do G-code

O gerador usa tres niveis de repeticao:

1. Repeticoes da rotina completa.
2. Lista de pontos X/Y cadastrados.
3. Repeticoes individuais de cada ponto.

Cada ponto tambem tem suas velocidades de movimento e seus tempos de espera:

- velocidade de descida em mm/s;
- tempo parado embaixo em segundos;
- velocidade de subida em mm/s;
- tempo parado em cima em segundos.

O app converte esses valores para o G-code:

- velocidade de descida/subida em mm/s vira feedrate `F` em mm/min;
- tempo parado embaixo/em cima em segundos vira `G4 P...` em milissegundos.

Fluxo gerado:

```txt
para cada repeticao da rotina completa:
  para cada ponto:
    mover para X/Y
    para cada repeticao do ponto:
      descer para o Z configurado em mm usando a velocidade de descida daquele ponto
      aguardar embaixo usando o tempo daquele ponto
      subir Z usando a velocidade de subida daquele ponto
      aguardar em cima usando o tempo daquele ponto
```

Os comentarios do G-code indicam o inicio da rotina, a repeticao atual da rotina completa, o ponto atual, os tempos configurados naquela posicao e a repeticao individual do ponto.

## Comunicacao com a maquina

O Electron nao acessa Python pelo React diretamente. A interface chama o `preload.ts`, o processo principal abre a ponte `electron/python/printcore_bridge.py`, e essa ponte usa:

- `serial.tools.list_ports` para listar portas.
- `printcore(porta, baudrate)` para conectar.
- `gcoder.LightGCode(lines)` e `startprint(...)` para enviar.
- `send_now("M112")` e `send_now("M410")` para parada de emergencia.
