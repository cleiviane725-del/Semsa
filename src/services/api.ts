import { dbService } from './db';

const ADMIN_USERNAME = 'SEMAD';
const ADMIN_PASSWORD = 'PIN25ADM';

let authToken = null;

export const api = {
  async login(username: string, password: string) {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      authToken = 'authenticated';
      return { ok: true };
    }
    return { ok: false, error: 'Credenciais inválidas' };
  },

  async logout() {
    authToken = null;
    return { ok: true };
  },

  async validateAuth() {
    return { ok: !!authToken };
  },

  async post(url: string, data: any) {
    if (!authToken) return { ok: false, error: 'Não autenticado' };
    
    if (url === '/api/cases') {
      try {
        const id = await dbService.addCase(data);
        return { 
          ok: true,
          json: () => Promise.resolve({ id, message: 'Processo cadastrado com sucesso' })
        };
      } catch (error) {
        console.error('Error saving case:', error);
        return { 
          ok: false, 
          json: () => Promise.resolve({ message: 'Erro ao salvar o processo' })
        };
      }
    }
    
    return { ok: false, error: 'URL não encontrada' };
  },

  async get(url: string) {
    if (!authToken) return { ok: false, error: 'Não autenticado' };
    
    if (url.startsWith('/api/cases/search')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const term = params.get('term') || '';
      const type = params.get('type') || 'all';
      
      try {
        const results = await dbService.searchCases(term, type);
        return { ok: true, json: () => Promise.resolve(results) };
      } catch (error) {
        console.error('Error searching cases:', error);
        return { 
          ok: false,
          json: () => Promise.resolve({ message: 'Erro ao buscar processos' })
        };
      }
    }
    
    return { ok: false, error: 'URL não encontrada' };
  },

  async delete(url: string) {
    if (!authToken) return { ok: false, error: 'Não autenticado' };
    
    if (url.startsWith('/api/cases/')) {
      const id = parseInt(url.split('/').pop() || '', 10);
      if (isNaN(id)) return { ok: false, error: 'ID inválido' };
      
      try {
        await dbService.deleteCase(id);
        return { ok: true };
      } catch (error) {
        console.error('Error deleting case:', error);
        return { ok: false, error: 'Erro ao excluir o processo' };
      }
    }
    
    return { ok: false, error: 'URL não encontrada' };
  }
};