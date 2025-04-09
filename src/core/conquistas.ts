import fs from "fs";
import path from "path";

const caminho = path.resolve(__dirname, "../../db/usuarios.json");

export const CONQUISTAS: {nome: Conquista; titulo: string, pontos: number}[] = [
    {nome: "calouro", titulo: "Calouro do RU 🎓", pontos: 10},
    {nome: "estagiario", titulo: "Estagiário do RU 🥉", pontos: 15},
    {nome: "estagiario_avancado", titulo: "Estagiário Avançado do RU🥈", pontos: 20},
    {nome: "junior", titulo: "Junior do RU 🥉", pontos: 25},
    {nome: "junior_avancado", titulo: "Junior Avançado do RU 🥈", pontos: 30},
    {nome: "pleno", titulo: "Pleno do RU 🥈", pontos: 35},
    {nome: "pleno_avancado", titulo: "Pleno Avançado do RU 🏅", pontos: 40},
    {nome: "senior", titulo: "Senior do RU 🏅", pontos: 45},
    {nome: "senior_avancado", titulo: "Senior Avançado do RU 🏆", pontos: 50},
    {nome: "master", titulo: "Master 💀", pontos: 60},
    {nome: "lendario", titulo: "Legendary 🔥", pontos: 90}
  
];

type Conquista =
  | "calouro"
  | "estagiario"
  | "estagiario_avancado"
  | "junior"
  | "junior_avancado"
  | "pleno"
  | "pleno_avancado"
  | "senior"
  | "senior_avancado"
  | "master"
  | "lendario";

  interface Usuario {
    id: string;
    nome: string;
    consultas: number;
    diasDistintos: Set<string>;
    conquistas: Conquista[]; 
  }

  const usuarios: Record<string, Usuario> = {};


  export function registrarConsulta(usuario: Usuario) {
    const hoje = new Date().toISOString().toString().split("T")[0];
    usuario.consultas++;
    usuario.diasDistintos.add(hoje);
    atualizarConquistas(usuario);

    salvarUsuarios();
  }

  function atualizarConquistas(usuario: Usuario) {
    const dias = usuario.diasDistintos.size;

    for (const conquista of CONQUISTAS) {
      if(dias >= conquista.pontos && !usuario.conquistas.includes(conquista.nome)) {
        usuario.conquistas.push(conquista.nome);
        console.log(`🎉 ${usuario.nome} desbloqueou ${conquista.nome}`);
      }
    }
  }

  export function gerarRankingPorDia(): string {
      const ranking: {nome: string; dias: number }[] = [];

      for (const user of Object.values(usuarios)) {
        const dias = user.diasDistintos.size;
        if(dias > 0){
          ranking.push({nome: user.nome, dias: user.diasDistintos.size });
        }
      }
    
      if(ranking.length === 0) return `❌ Nenhuma consulta registrada até o momento.`;

      ranking.sort((a, b) => b.dias - a.dias);

      let resposta = `🏆 Ranking de consulta no cardápio:\n\n`

      const top3 = ranking.slice(0, 3);
      top3.forEach((entry, index) => {
        const medalha = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
        resposta += `${medalha} ${entry.nome} - ${entry.dias} Consulta de dias\n`;
      });

      return resposta.trim();
  }

  export function exibirConquistas(usuario: Usuario): string {
    const conquistadas = CONQUISTAS.filter((c) =>
      usuario.conquistas.includes(c.nome)
    );

    let resposta = `🎖️ Conquistas de ${usuario.nome}:\n`;

    if(conquistadas.length === 0){
      resposta += `- 😕 Você ainda não conquistou nenhum título.\n`;
    } else {
      for (const conquista of conquistadas) {
        resposta += `- ${conquista.titulo} (${conquista.pontos} pts)\n`;
      }
    }

    const dias = usuario.diasDistintos.size;
    const proxima = CONQUISTAS.find(
      (c) => !usuario.conquistas.includes(c.nome) && dias < c.pontos
    );

    if(proxima) {
      resposta += `\n🏆 Próxima conquista: ${proxima.titulo} (${proxima.pontos} pts)`;
    } else {
      resposta += `\n🏆 Próxima conquista: Nenhuma! Você chegou ao topo! 💀`;
    }

    return resposta.trim();
  }

  export function getOrCreateUsuario(id: string, nome: string): Usuario {
    if(!usuarios[id]) {
      usuarios[id] = {
        id,
        nome,
        consultas: 0,
        diasDistintos: new Set(),
        conquistas: [],
      };
    }
    return usuarios[id];
  }

  function salvarUsuarios(): void {
    fs.writeFileSync(caminho, JSON.stringify(usuarios, (key, value) => {
      if(value instanceof Set) {
        return [...value]
      }
      return value;
    }))
  }

  export function carregarUsuarios(): void {
    if(fs.existsSync(caminho)){
      const data = fs.readFileSync(caminho, "utf-8");
      const json = JSON.parse(data);
      for(const id in json) {
        const usuario = json[id];
        usuario.diasDistintos = new Set(usuario.diasDistintos);
        usuarios[id] = usuario;
      }
    }
  }