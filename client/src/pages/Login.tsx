/**
 * صفحة تسجيل الدخول والتسجيل المستقلة
 * لا تعتمد على Manus OAuth — JWT محلي مباشر
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // حالة نموذج تسجيل الدخول
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // حالة نموذج إنشاء الحساب
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("مرحباً بك في فضاء! 🎨");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "بيانات الدخول غير صحيحة");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("تم إنشاء حسابك بنجاح! أهلاً بك في فضاء 🎉");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "فشل إنشاء الحساب");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error("يرجى إدخال جميع البيانات المطلوبة");
      return;
    }
    registerMutation.mutate({ name: registerName, email: registerEmail, password: registerPassword });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
      }}
    >
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c9a96e, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b6914, transparent)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* شعار المنصة */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "linear-gradient(135deg, #c9a96e, #8b6914)" }}>
              ✦
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-white">فضاء</h1>
              <p className="text-xs" style={{ color: "#c9a96e" }}>م. سارة | خبيرة التصميم الداخلي</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderColor: "rgba(201,169,110,0.2)" }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-center text-xl">مرحباً بك</CardTitle>
            <CardDescription className="text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
              سجّل دخولك أو أنشئ حساباً جديداً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" dir="rtl">
              <TabsList className="w-full mb-6" style={{ background: "rgba(255,255,255,0.1)" }}>
                <TabsTrigger value="login" className="flex-1 text-white data-[state=active]:text-black">
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1 text-white data-[state=active]:text-black">
                  حساب جديد
                </TabsTrigger>
              </TabsList>

              {/* نموذج تسجيل الدخول */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="text-right border-0 text-white placeholder:text-white/30"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="text-right border-0 text-white placeholder:text-white/30 pr-10"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-semibold mt-2"
                    style={{ background: "linear-gradient(135deg, #c9a96e, #8b6914)", color: "white" }}
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <><Loader2 size={16} className="animate-spin ml-2" /> جارٍ الدخول...</>
                    ) : "دخول"}
                  </Button>
                </form>
              </TabsContent>

              {/* نموذج إنشاء حساب */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">الاسم الكامل</Label>
                    <Input
                      type="text"
                      placeholder="اسمك الكريم"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="text-right border-0 text-white placeholder:text-white/30"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="text-right border-0 text-white placeholder:text-white/30"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="8 أحرف على الأقل"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="text-right border-0 text-white placeholder:text-white/30 pr-10"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-semibold mt-2"
                    style={{ background: "linear-gradient(135deg, #c9a96e, #8b6914)", color: "white" }}
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <><Loader2 size={16} className="animate-spin ml-2" /> جارٍ إنشاء الحساب...</>
                    ) : "إنشاء حساب"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
          منصة فضاء — تصميم داخلي بالذكاء الاصطناعي
        </p>
      </div>
    </div>
  );
}
