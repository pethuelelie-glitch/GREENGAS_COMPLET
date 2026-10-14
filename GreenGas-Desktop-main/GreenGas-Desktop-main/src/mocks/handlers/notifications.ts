import type { TypeNotification } from '@/api/types';
import { introuvable } from '../erreurs';
import { maintenant } from '../horloge';
import { paginer, route } from '../http';
import { notificationApi } from '../notifications';

/** Notifications (contrat 1.4.0) : chacun ne voit que les siennes ; celle d'un autre renvoie 404. */
export const handlersNotifications = [
  route('get', '/notifications/', (ctx) => {
    const moi = ctx.moi();
    const lue = ctx.query.get('lue');
    const type = ctx.query.get('type') as TypeNotification | null;
    const liste = ctx.etat.notifications
      .filter((n) => n.destinataire_id === moi.id)
      .filter((n) => lue === null || String(n.lue) === lue)
      .filter((n) => !type || n.type === type)
      .sort((a, b) => b.date_creation.localeCompare(a.date_creation))
      .map(notificationApi);
    return paginer(ctx, liste);
  }),

  route('get', '/notifications/compteur/', (ctx) => {
    const moi = ctx.moi();
    return { non_lues: ctx.etat.notifications.filter((n) => n.destinataire_id === moi.id && !n.lue).length };
  }),

  route('post', '/notifications/:id/lue/', (ctx) => {
    const moi = ctx.moi();
    const n = ctx.etat.notifications.find((x) => x.id === ctx.params.id && x.destinataire_id === moi.id);
    if (!n) throw introuvable('Notification');
    if (!n.lue) {
      n.lue = true;
      n.date_lecture = maintenant();
    }
    return notificationApi(n);
  }),

  route('post', '/notifications/tout-lire/', (ctx) => {
    const moi = ctx.moi();
    const instant = maintenant();
    let marquees = 0;
    for (const n of ctx.etat.notifications) {
      if (n.destinataire_id === moi.id && !n.lue) {
        n.lue = true;
        n.date_lecture = instant;
        marquees += 1;
      }
    }
    return { marquees };
  }),
];
