import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RELAY_URL = "https://relay-email.netlify.app/.netlify/functions/send-email";
const RELAY_TOKEN = Deno.env.get("RELAY_EMAIL_TOKEN");

interface IndicacaoEmailRequest {
  consultorEmail: string;
  consultorNome: string;
  nomeCliente: string;
  telCliente: string;
  nomeCorretor: string;
  unidadeCorretor: string;
  natureza: string;
  cidade: string;
  descricaoSituacao?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: IndicacaoEmailRequest = await req.json();
    
    console.log("📧 Enviando email para consultor:", data.consultorEmail);
    console.log("📋 Dados da indicação:", JSON.stringify(data, null, 2));

    if (!RELAY_TOKEN) {
      console.error("❌ RELAY_EMAIL_TOKEN não configurado");
      throw new Error("RELAY_EMAIL_TOKEN não configurado");
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Nova Indicação Recebida!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
          <p style="font-size: 16px; color: #333;">
            Olá <strong>${data.consultorNome}</strong>,
          </p>
          <p style="font-size: 16px; color: #333;">
            Você recebeu uma nova indicação! Confira os detalhes abaixo:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">📋 Dados do Cliente</h3>
            <p><strong>Nome:</strong> ${data.nomeCliente}</p>
            <p><strong>Telefone:</strong> ${data.telCliente}</p>
            <p><strong>Cidade:</strong> ${data.cidade}</p>
            <p><strong>Natureza:</strong> ${data.natureza}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">👤 Corretor Indicador</h3>
            <p><strong>Nome:</strong> ${data.nomeCorretor}</p>
            <p><strong>Unidade:</strong> ${data.unidadeCorretor}</p>
          </div>
          
          ${data.descricaoSituacao ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">📝 Descrição da Situação</h3>
            <p>${data.descricaoSituacao}</p>
          </div>
          ` : ''}
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Entre em contato com o cliente o mais rápido possível!
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="margin: 0; font-size: 12px;">
            Sistema de Indicações - GRUPO CRI/ADIM
          </p>
        </div>
      </div>
    `;

    const emailResponse = await fetch(RELAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-secret": RELAY_TOKEN,
      },
      body: JSON.stringify({
        to: data.consultorEmail,
        subject: `🎉 Nova Indicação: ${data.nomeCliente} - ${data.natureza}`,
        html: htmlContent,
      }),
    });

    const responseData = await emailResponse.json();
    console.log("📨 Resposta do relay:", JSON.stringify(responseData));

    if (!emailResponse.ok) {
      console.error("❌ Erro ao enviar email:", responseData);
      throw new Error(responseData.message || "Erro ao enviar email");
    }

    console.log("✅ Email enviado com sucesso para:", data.consultorEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado com sucesso" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("❌ Erro na função send-indicacao-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
