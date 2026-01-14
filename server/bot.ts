import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { type User } from '@shared/schema';

// Configuration
const TOKEN = "8211731933:AAG7CSbxtCp9jDW77ikPKowHH-Sx3R95Iho";
const ADMIN_ID = "7896147898";
const MISTICPAY_CLIENT_ID = "ci_hbuy5bjdcgfpabv";
const MISTICPAY_CLIENT_SECRET = "cs_x5uighxhuckyo7jgv3xl090bj";
const MISTICPAY_API_URL = "https://api.misticpay.com/api";

let bot: TelegramBot;

// MisticPay API Helper
const misticPayApi = axios.create({
  baseURL: MISTICPAY_API_URL,
  headers: {
    'ci': MISTICPAY_CLIENT_ID,
    'cs': MISTICPAY_CLIENT_SECRET,
    'Content-Type': 'application/json'
  }
});

export function startBot() {
  if (bot) return;

  bot = new TelegramBot(TOKEN, { polling: true });

  console.log("Nuvixpay Bot Started...");

  // Start Command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    const username = msg.from?.username;
    const firstName = msg.from?.first_name;

    if (!telegramId) return;

    let user = await storage.getUserByTelegramId(telegramId);

    if (!user) {
      user = await storage.createUser({
        telegramId,
        username: username || null,
        firstName: firstName || null,
        isApproved: false,
      });

      // Notify Admin
      bot.sendMessage(ADMIN_ID, `
🚨 <b>Novo Usuário Aguardando Aprovação</b>

🆔 ID: ${telegramId}
👤 Usuário: @${username || 'Sem user'}
Nome: ${firstName}

Acesse o painel para aprovar.
      `, { parse_mode: 'HTML' });

      bot.sendMessage(chatId, "⏳ Seu cadastro foi enviado para análise. Aguarde a aprovação do administrador.");
      return;
    }

    if (!user.isApproved) {
      bot.sendMessage(chatId, "⏳ Seu cadastro ainda está em análise. Aguarde a aprovação.");
      return;
    }

    sendMainMenu(chatId, user);
  });

  // Admin Withdraw Command
  bot.onText(/\/sacar/, async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== ADMIN_ID) return;

    const fees = await storage.getAdminFees();
    if (fees <= 0) {
      bot.sendMessage(chatId, "⚠️ Sem taxas acumuladas para saque.");
      return;
    }

    // In a real scenario, we would ask for PIX key. Here we simulate or ask.
    // Simplified: Just message for now or ask for key
    bot.sendMessage(chatId, `💰 <b>Saldo de Taxas:</b> R$ ${fees.toFixed(2)}\n\nPara sacar, digite a chave PIX (CPF/CNPJ/Email/Tel/Aleatoria) abaixo:`, { parse_mode: 'HTML' });
    
    bot.once('message', async (response) => {
        if (response.text?.startsWith('/')) return; // Cancel if command
        const pixKey = response.text;
        if (!pixKey) return;

        try {
            // Withdraw Logic
            const withdrawResponse = await misticPayApi.post('/transactions/withdraw', {
                amount: fees,
                pixKey: pixKey,
                pixKeyType: determinePixKeyType(pixKey),
                description: "Saque Administrativo Nuvixpay"
            });
            
            await storage.resetAdminFees();
            bot.sendMessage(chatId, "✅ Saque administrativo solicitado com sucesso!");
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "❌ Erro ao processar saque administrativo.");
        }
    });
  });

  // Callback Queries
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;
    const telegramId = query.from.id.toString();

    if (!chatId || !messageId) return;

    const user = await storage.getUserByTelegramId(telegramId);
    if (!user || !user.isApproved) return;

    if (data === 'main_menu') {
        const now = new Date().toLocaleString('pt-BR');
        const imageUrl = "https://xatimg.com/image/YFBe0K2AC4GO.png";
        const caption = `
🏦 <b>Nuvixpay - Seu Gateway Digital</b>

👤 <b>Informações da Conta</b>
├ 🆔 ID: ${user.telegramId}
├ 💰 Saldo: R$ ${user.balance}
└ 📅 Atualizado: ${now}

<a href="${imageUrl}">&#8205;</a>
    `;

        const keyboard = {
            inline_keyboard: [
                [{ text: "💰 Depositar", callback_data: "deposit" }, { text: "💸 Sacar", callback_data: "withdraw" }],
                [{ text: "👤 Perfil", callback_data: "profile" }]
            ]
        };

        await bot.editMessageText(caption, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    } else if (data === 'deposit') {
        bot.sendMessage(chatId, "💰 <b>Depósito via PIX</b>\n\nDigite o valor que deseja depositar (Mínimo R$ 3,00):", { parse_mode: 'HTML' });
        
        const handler = async (msg: TelegramBot.Message) => {
            if (msg.chat.id !== chatId) return;
            bot.removeListener('message', handler);
            
            const amount = parseFloat(msg.text?.replace(',', '.') || '0');
            if (isNaN(amount) || amount < 3) {
                bot.sendMessage(chatId, "❌ Valor inválido. Mínimo R$ 3,00.");
                return;
            }

            try {
                const fee = 1.00;
                const response = await misticPayApi.post('/transactions/create', {
                    amount: amount,
                    payerName: user.firstName || "Usuario",
                    payerDocument: "00000000000",
                    transactionId: uuidv4(),
                    description: `Deposito Nuvixpay User ${user.id}`
                });

                const txData = response.data.data;
                
                await storage.createTransaction({
                    userId: user.id,
                    type: 'deposit',
                    amount: amount.toString(),
                    fee: fee.toString(),
                    status: 'pending',
                    externalId: txData.transactionId.toString(),
                    paymentMethod: 'pix'
                });

                const qrCode = txData.copyPaste;
                const qrCodeImg = Buffer.from(txData.qrCodeBase64.split(',')[1], 'base64');
                
                const caption = `💰 <b>Valor:</b> R$ ${amount.toFixed(2)}\n\n📌 <b>Pix Copia e Cola:</b>\n<code>${qrCode}</code>\n\nApós o pagamento, aguarde a confirmação automática.\n<a href="https://xatimg.com/image/4MAmT3rlXAZz.png">&#8205;</a>`;

                const keyboard = {
                    inline_keyboard: [
                        [{ text: "✅ Já paguei", callback_data: `check_pix_${txData.transactionId}` }],
                        [{ text: "⬅️ Voltar", callback_data: "main_menu" }]
                    ]
                };

                await bot.sendPhoto(chatId, qrCodeImg, {
                    caption: caption,
                    parse_mode: 'HTML',
                    reply_markup: keyboard
                });
            } catch (error: any) {
                console.error("Depósito Error:", error.response?.data || error.message);
                bot.sendMessage(chatId, "❌ Erro ao gerar PIX. Tente novamente mais tarde.");
            }
        };
        bot.on('message', handler);
    } else if (data?.startsWith('check_pix_')) {
        const txId = data.replace('check_pix_', '');
        try {
            const response = await misticPayApi.post('/transactions/check', { transactionId: txId });
            const status = response.data.transaction.transactionState;

            if (status === 'COMPLETO') {
                // Find local transaction to credit user
                // (This would ideally be handled by a more robust sync, but for MVP we check)
                const [tx] = await storage.getTransactionsByUser(user.id); // Get last tx
                if (tx && tx.externalId === txId && tx.status === 'pending') {
                    const creditAmount = parseFloat(tx.amount) - parseFloat(tx.fee);
                    await storage.updateUserBalance(user.id, creditAmount);
                    await storage.updateTransactionStatus(tx.id, 'completed');
                    await storage.updateAdminFees(parseFloat(tx.fee));
                    
                    bot.answerCallbackQuery(query.id, { text: "✅ Pagamento confirmado! Saldo creditado.", show_alert: true });
                    // Return to main menu
                    const updatedUser = await storage.getUser(user.id);
                    if (updatedUser) sendMainMenu(chatId, updatedUser);
                } else {
                    bot.answerCallbackQuery(query.id, { text: "✅ Pagamento já processado anteriormente.", show_alert: true });
                }
            } else {
                bot.answerCallbackQuery(query.id, { text: "⏳ Pagamento ainda não detectado. Tente novamente em alguns instantes.", show_alert: true });
            }
        } catch (error) {
            bot.answerCallbackQuery(query.id, { text: "❌ Erro ao verificar pagamento.", show_alert: true });
        }
    } else if (data === 'withdraw') {
        const keyboard = {
            inline_keyboard: [
                [{ text: "💠 PIX", callback_data: "withdraw_pix" }],
                [{ text: "🪙 Crypto (USDT)", callback_data: "withdraw_crypto" }],
                [{ text: "⬅️ Voltar", callback_data: "main_menu" }]
            ]
        };
        const text = "💸 <b>Escolha a forma de saque:</b>";
        try {
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML',
                reply_markup: keyboard
            });
        } catch (e) {
            await bot.sendMessage(chatId, text, {
                parse_mode: 'HTML',
                reply_markup: keyboard
            });
        }
    } else if (data === 'withdraw_pix') {
        const keyboard = {
            inline_keyboard: [
                [{ text: "🆔 CPF", callback_data: "withdraw_pix_type_CPF" }],
                [{ text: "🏢 CNPJ", callback_data: "withdraw_pix_type_CNPJ" }],
                [{ text: "📧 E-mail", callback_data: "withdraw_pix_type_EMAIL" }],
                [{ text: "📱 Telefone", callback_data: "withdraw_pix_type_TELEFONE" }],
                [{ text: "🔀 Chave Aleatória", callback_data: "withdraw_pix_type_CHAVE_ALEATORIA" }],
                [{ text: "⬅️ Voltar", callback_data: "withdraw" }]
            ]
        };
        await bot.editMessageText("🔑 <b>Escolha o tipo de chave PIX:</b>", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    } else if (data?.startsWith('withdraw_pix_type_')) {
        const pixType = data.replace('withdraw_pix_type_', '');
        bot.sendMessage(chatId, `💸 <b>Saque PIX (${pixType})</b>\n\nDigite o valor (Mínimo R$ 2,00):`, { parse_mode: 'HTML' });
        
        const handler = async (msg: TelegramBot.Message) => {
            if (msg.chat.id !== chatId) return;
            bot.removeListener('message', handler);

            const amount = parseFloat(msg.text?.replace(',', '.') || '0');
            if (isNaN(amount) || amount < 2) {
                 bot.sendMessage(chatId, "❌ Valor inválido. Mínimo R$ 2,00.");
                 return;
            }
            
            if (amount > parseFloat(user.balance)) {
                bot.sendMessage(chatId, "❌ Saldo insuficiente.");
                return;
            }

            bot.sendMessage(chatId, `🔑 Digite sua chave PIX (${pixType}):`);
            const keyHandler = async (keyMsg: TelegramBot.Message) => {
                if (keyMsg.chat.id !== chatId) return;
                bot.removeListener('message', keyHandler);
                
                const pixKey = keyMsg.text || "";
                
                try {
                     const fee = 0.50;
                     // User wants the fee to be deducted FROM the amount.
                     // So they request 2.00, we send 1.50 to the API, and deduct 2.00 from balance.
                     const netAmount = amount - fee;
                     
                     if (netAmount <= 0) {
                        bot.sendMessage(chatId, `❌ O valor líquido (R$ ${netAmount.toFixed(2)}) após a taxa de R$ ${fee.toFixed(2)} deve ser maior que zero.`);
                        return;
                     }

                     // Call API with netAmount
                     await misticPayApi.post('/transactions/withdraw', {
                        amount: netAmount,
                        pixKey: pixKey,
                        pixKeyType: pixType,
                        description: `Saque User ${user.id}`
                     });

                     await storage.updateUserBalance(user.id, -amount);
                     await storage.createTransaction({
                        userId: user.id,
                        type: 'withdrawal',
                        amount: amount.toString(),
                        fee: fee.toString(),
                        status: 'pending',
                        paymentMethod: 'pix'
                     });
                     await storage.updateAdminFees(fee);

                     bot.sendMessage(chatId, `✅ Saque de R$ ${amount.toFixed(2)} solicitado!\n💰 Valor enviado: R$ ${netAmount.toFixed(2)}\n💸 Taxa: R$ ${fee.toFixed(2)}`);

                } catch (error) {
                    console.error("Withdraw Error", error);
                    bot.sendMessage(chatId, "❌ Erro ao processar saque.");
                }
            };
            bot.on('message', keyHandler);
        };
        bot.on('message', handler);
    } else if (data === 'withdraw_crypto') {
        bot.sendMessage(chatId, "💸 <b>Saque Crypto (USDT BEP20)</b>\n\nDigite o valor (Mínimo R$ 20,00 conforme MisticPay):", { parse_mode: 'HTML' });
        const handler = async (msg: TelegramBot.Message) => {
            if (msg.chat.id !== chatId) return;
            bot.removeListener('message', handler);

            const amount = parseFloat(msg.text?.replace(',', '.') || '0');
            if (isNaN(amount) || amount < 20) {
                 bot.sendMessage(chatId, "❌ Valor inválido. Mínimo R$ 20,00 para Crypto.");
                 return;
            }
            
            if (amount > parseFloat(user.balance)) {
                bot.sendMessage(chatId, "❌ Saldo insuficiente.");
                return;
            }

            bot.sendMessage(chatId, "🔑 Digite sua carteira BEP20 (0x...):");
            const walletHandler = async (walletMsg: TelegramBot.Message) => {
                if (walletMsg.chat.id !== chatId) return;
                bot.removeListener('message', walletHandler);
                
                const wallet = walletMsg.text || "";
                
                try {
                     const fee = 0.50; // Extra flat fee defined in prompt
                     const totalDeduct = amount + fee;
                     
                     if (totalDeduct > parseFloat(user.balance)) {
                        bot.sendMessage(chatId, `❌ Saldo insuficiente para cobrir valor + taxa (R$ ${fee.toFixed(2)}).`);
                        return;
                     }

                     await misticPayApi.post('/crypto/withdraw-api', {
                        amount: amount,
                        wallet: wallet,
                        description: `Saque Crypto User ${user.id}`
                     });

                     await storage.updateUserBalance(user.id, -totalDeduct);
                     await storage.createTransaction({
                        userId: user.id,
                        type: 'withdrawal',
                        amount: amount.toString(),
                        fee: fee.toString(),
                        status: 'pending',
                        paymentMethod: 'crypto'
                     });
                     await storage.updateAdminFees(fee);

                     bot.sendMessage(chatId, "✅ Saque crypto solicitado com sucesso!");
                } catch (error) {
                    console.error("Crypto Withdraw Error", error);
                    bot.sendMessage(chatId, "❌ Erro ao processar saque crypto.");
                }
            };
            bot.on('message', walletHandler);
        };
        bot.on('message', handler);
    } else if (data === 'history') {
        const keyboard = {
            inline_keyboard: [
                [{ text: "💰 Depósitos", callback_data: "history_deposit" }, { text: "💸 Saques", callback_data: "history_withdraw" }],
                [{ text: "⬅️ Voltar", callback_data: "profile" }]
            ]
        };
        await bot.editMessageText("📊 <b>Escolha o histórico que deseja ver:</b>", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    } else if (data === 'history_deposit' || data === 'history_withdraw') {
        const type = data === 'history_deposit' ? 'deposit' : 'withdrawal';
        const txs = await storage.getTransactionsByUser(user.id);
        const filtered = txs.filter(t => t.type === type).slice(0, 10);
        
        let text = `📊 <b>Histórico de ${type === 'deposit' ? 'Depósitos' : 'Saques'}</b>\n\n`;
        if (filtered.length === 0) {
            text += "Nenhuma transação encontrada.";
        } else {
            filtered.forEach(t => {
                text += `📅 ${t.createdAt?.toLocaleString('pt-BR')}\n💰 Valor: R$ ${t.amount} (Taxa: R$ ${t.fee})\n✅ Status: ${t.status}\n\n`;
            });
        }

        const keyboard = {
            inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "history" }]]
        };
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    } else if (data === 'profile') {
        const now = new Date().toLocaleString('pt-BR');
        const keyboard = {
            inline_keyboard: [
                [{ text: "📊 Histórico", callback_data: "history" }],
                [{ text: "⬅️ Voltar", callback_data: "main_menu" }]
            ]
        };
        await bot.editMessageText(`
👤 <b>Seu Perfil</b>

🆔 ID: ${user.telegramId}
👤 Usuário: @${user.username || 'N/A'}
💰 Saldo Disponível: R$ ${user.balance}
📅 Data: ${now}
        `, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    }
  });

  bot.on('polling_error', (error) => {
    console.log(error);  // Supress polling errors in logs
  });
}

function sendMainMenu(chatId: number, user: User) {
    const now = new Date().toLocaleString('pt-BR');
    const imageUrl = "https://xatimg.com/image/YFBe0K2AC4GO.png";
    const caption = `
🏦 <b>Nuvixpay - Seu Gateway Digital</b>

👤 <b>Informações da Conta</b>
├ 🆔 ID: ${user.telegramId}
├ 💰 Saldo: R$ ${user.balance}
└ 📅 Atualizado: ${now}

<a href="${imageUrl}">&#8205;</a>
    `;

    const keyboard = {
        inline_keyboard: [
            [{ text: "💰 Depositar", callback_data: "deposit" }, { text: "💸 Sacar", callback_data: "withdraw" }],
            [{ text: "👤 Perfil", callback_data: "profile" }]
        ]
    };

    bot.sendMessage(chatId, caption, { 
        parse_mode: 'HTML', 
        reply_markup: keyboard 
    });
}

function determinePixKeyType(key: string): string {
    if (key.includes('@')) return 'EMAIL';
    if (key.length === 11 && !isNaN(Number(key))) return 'CPF';
    if (key.length === 14 && !isNaN(Number(key))) return 'CNPJ';
    if (key.length > 20) return 'CHAVE_ALEATORIA';
    return 'TELEFONE';
}
