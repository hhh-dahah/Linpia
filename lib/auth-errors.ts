export function mapAuthErrorMessage(message?: string | null) {
  const normalized = (message || "").toLowerCase();

  if (!normalized) {
    return "操作没有成功，请稍后再试。";
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "邮箱或密码不正确。";
  }

  if (normalized.includes("email not confirmed")) {
    return "账号暂时无法登录，请稍后重试。";
  }

  if (normalized.includes("user already registered")) {
    return "这个邮箱已经注册过了，直接登录就可以。";
  }

  if (normalized.includes("signup is disabled")) {
    return "当前暂时不能注册，请稍后再试。";
  }

  if (normalized.includes("password should be at least")) {
    return "密码至少需要 6 位。";
  }

  if (normalized.includes("same password")) {
    return "新密码不能和旧密码一样。";
  }

  if (normalized.includes("for security purposes")) {
    return "发送过于频繁，请稍后再试。";
  }

  if (normalized.includes("user not found")) {
    return "该邮箱尚未注册。";
  }

  if (normalized.includes("expired") || normalized.includes("invalid token")) {
    return "链接已失效，请重新操作。";
  }

  if (normalized.includes("network")) {
    return "网络有点不稳定，请稍后重试。";
  }

  return "操作没有成功，请稍后再试。";
}
