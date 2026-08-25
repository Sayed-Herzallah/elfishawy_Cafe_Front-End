/**
 * أصوات التنبيه الموحدة — Web Audio API بدون مكتبات خارجية
 * ---------------------------------------------------------
 * ✅ playAlertSound('low')  → نبضة صفراء للمخزون المنخفض
 * ✅ playAlertSound('out')  → نبضتان حمراء للمنتج النافد
 * ✅ playSuccessSound()     → نغمة صاعدة (C-E-G) لتأكيد التوريد/الشراء
 */

/** تشغيل نغمة تنبيه قصيرة */
export const playAlertSound = (type: 'low' | 'out') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // نافد → نبضتان حمراء | منخفض → نبضة واحدة صفراء
    osc.frequency.value = type === 'out' ? 880 : 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    if (type === 'out') {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 660;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc2.start(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.7);
    }
  } catch (_) {
    // المتصفح مش بيدعم Web Audio — نتجاهل بهدوء
  }
};

/** نغمة تأكيد عند نجاح التوريد (C-E-G صاعدة) */
export const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
    });
  } catch (_) {}
};
