<?php

/* themes/upjv/templates/menu--menu-sous-bandeau.html.twig */
class __TwigTemplate_df32a11b5a5eebfc3ec280146c63af603c702f2f6b4af91105390fee45a8e757 extends Twig_Template
{
    public function __construct(Twig_Environment $env)
    {
        parent::__construct($env);

        $this->parent = false;

        $this->blocks = array(
        );
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
        $tags = array("import" => 1, "if" => 3, "for" => 6);
        $filters = array();
        $functions = array("file_url" => 17);

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array('import', 'if', 'for'),
                array(),
                array('file_url')
            );
        } catch (Twig_Sandbox_SecurityError $e) {
            $e->setTemplateFile($this->getTemplateName());

            if ($e instanceof Twig_Sandbox_SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

        // line 1
        $context["menus"] = $this;
        // line 2
        echo "
  ";
        // line 3
        if (((isset($context["items"]) ? $context["items"] : null) || $this->getAttribute((isset($context["user"]) ? $context["user"] : null), "getUserName", array()))) {
            // line 4
            echo "        
        <ul id=\"portails_ent\">
        ";
            // line 6
            $context['_parent'] = $context;
            $context['_seq'] = twig_ensure_traversable((isset($context["items"]) ? $context["items"] : null));
            foreach ($context['_seq'] as $context["_key"] => $context["item"]) {
                // line 7
                echo "              <li>
                  <a href=\"";
                // line 8
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["item"], "url", array()), "html", null, true));
                echo "\">
                      ";
                // line 9
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["item"], "title", array()), "html", null, true));
                echo "
                  </a>
              </li>

          ";
            }
            $_parent = $context['_parent'];
            unset($context['_seq'], $context['_iterated'], $context['_key'], $context['item'], $context['_parent'], $context['loop']);
            $context = array_intersect_key($context, $_parent) + $_parent;
            // line 14
            echo "
                    ";
            // line 15
            if ($this->getAttribute((isset($context["user"]) ? $context["user"] : null), "getUserName", array())) {
                // line 16
                echo "            <li>
             <a href=\"";
                // line 17
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, call_user_func_array($this->env->getFunction('file_url')->getCallable(), array("user/logout")), "html", null, true));
                echo "\"> Déconnexion </a>
             </li>
          ";
            }
            // line 20
            echo "
</ul>


  ";
        }
        // line 25
        echo "
";
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/menu--menu-sous-bandeau.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  97 => 25,  90 => 20,  84 => 17,  81 => 16,  79 => 15,  76 => 14,  65 => 9,  61 => 8,  58 => 7,  54 => 6,  50 => 4,  48 => 3,  45 => 2,  43 => 1,);
    }
}
/* {% import _self as menus %}*/
/* */
/*   {% if items or user.getUserName  %}*/
/*         */
/*         <ul id="portails_ent">*/
/*         {% for item in items %}*/
/*               <li>*/
/*                   <a href="{{ item.url }}">*/
/*                       {{ item.title }}*/
/*                   </a>*/
/*               </li>*/
/* */
/*           {% endfor %}*/
/* */
/*                     {% if  user.getUserName %}*/
/*             <li>*/
/*              <a href="{{ file_url('user/logout') }}"> Déconnexion </a>*/
/*              </li>*/
/*           {% endif %}*/
/* */
/* </ul>*/
/* */
/* */
/*   {% endif %}*/
/* */
/* */
