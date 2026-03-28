"use client";

import { useState, useTransition } from "react";

import { sendConversationMessageAction } from "@/app/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { initialActionState, type ActionState } from "@/types/action";

type ConversationReplyFormProps = {
  threadId: string;
};

export function ConversationReplyForm({ threadId }: ConversationReplyFormProps) {
  const [serverState, setServerState] = useState<ActionState>(initialActionState);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setServerState(initialActionState);
        startTransition(async () => {
          const result = await sendConversationMessageAction(formData);
          setServerState({
            status: result.status,
            message: result.message,
          });
          if (result.status === "success") {
            form.reset();
          }
        });
      }}
    >
      <input type="hidden" name="threadId" value={threadId} />
      <textarea
        name="body"
        rows={4}
        className="field-base"
        placeholder="发送一条和当前合作推进直接相关的消息"
      />
      <FormFeedback state={serverState} />
      <button
        type="submit"
        disabled={isPending}
        className="ui-button-primary px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "发送中..." : "发送消息"}
      </button>
    </form>
  );
}
