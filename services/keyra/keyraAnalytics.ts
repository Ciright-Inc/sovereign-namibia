import type { KeyraContext, KeyraEventName, VisitorAnalytics } from "./types";
import { createKeyraContext, getKeyraObjectId } from "./keyraClient";
import { persistAnalyticsEvent, upsertVisitorAnalytics } from "@/lib/keyra-persistence";

export const KeyraAnalytics = {
  async captureEvent(event: KeyraEventName, ctx: Partial<KeyraContext> & { page_url?: string; metadata?: Record<string, unknown> }) {
    const context = createKeyraContext(ctx);
    await persistAnalyticsEvent({
      event_name: event,
      visitor_id: String(ctx.metadata?.visitor_id ?? ctx.session_id ?? context.session_id),
      session_id: context.session_id,
      user_id: context.user_id,
      device_id: context.device_id,
      keyra_object_id: getKeyraObjectId(),
      country_code: context.country_code,
      ip_address: context.ip_address,
      page_url: ctx.page_url,
      metadata: ctx.metadata,
    });
    return context;
  },

  async captureVisitor(visitor: VisitorAnalytics) {
    await upsertVisitorAnalytics({ ...visitor, keyra_object_id: visitor.keyra_object_id ?? getKeyraObjectId() });
  },
};
