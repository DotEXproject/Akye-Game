/**
 * Akye's outbound email adapter. Requires RESEND_API_KEY and AKYE_MAIL_FROM
 * as deployment secrets/config. Never log message bodies or verification codes.
 * Does not send anything unless the caller explicitly invokes send().
 */
export function mailerFor(env){
 if(env.AKYE_MAILER?.send)return env.AKYE_MAILER;
 if(!env.RESEND_API_KEY||!env.AKYE_MAIL_FROM)return null;
 return {async send({to,subject,text}){
  if(typeof to!=='string'||typeof subject!=='string'||typeof text!=='string'||!/^\S+@\S+\.\S+$/.test(to)||!subject.trim()||!text.trim())throw new Error('Invalid outbound email payload');
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({from:env.AKYE_MAIL_FROM,to:[to],subject,text})
  });
  if(!response.ok)throw new Error('Outbound email provider rejected delivery: HTTP '+response.status);
  return true;
 }};
}
export function withMailer(env){
 const mailer=mailerFor(env);
 return mailer?{...env,AKYE_MAILER:mailer}:env;
}
