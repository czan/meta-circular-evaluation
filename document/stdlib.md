(def defn
  (fexpr (env name args body)
    (eval (list (quote def) name (list (quote fn) args body))
          env)))

(defn ret2 (a b)
  b)

(def toc-entries (quote ()))

(defn repeat (level string)
  (if (= level 0)
    ""
    {@{@string}@(repeat (- level 1) string)}))

(defn print-toc (entries level)
  (join (map (fn (x) (print-toc-entry x level)) entries) ""))

(defn print-toc-entry (entry level)
  {@(repeat level "  ")- [@(first entry)](#@(normalize-link (first entry)))
@(print-toc (rest entry) (+ level 1))})

(defn toc ()
  (delay (print-toc toc-entries 0)))



(defn heading (title)
  (ret2
   (push toc-entries (list title))
   {## @title}))
         
(defn subheading (title)
  (ret2
   (push (last toc-entries) (list title))
   {### @title}))


(def example
  (fexpr (env form)
    {@form => @(eval form env)}))
