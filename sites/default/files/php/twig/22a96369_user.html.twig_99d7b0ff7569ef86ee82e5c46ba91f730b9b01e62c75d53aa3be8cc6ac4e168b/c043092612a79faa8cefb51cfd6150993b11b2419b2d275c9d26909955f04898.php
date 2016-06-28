<?php

/* themes/upjv/templates/user.html.twig */
class __TwigTemplate_4428269f42bd928e542fa3de49509966f721ae6b40ee5a881574a190490866fd extends Twig_Template
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
        $tags = array();
        $filters = array();
        $functions = array("file_url" => 19);

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array(),
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
        echo "<div id=\"page_deco\">

        <div id=\"avec_nav_sans_encadres\" class=\"contenu\">
        \t<div>

                <div class=\"ligne_1\">

                    <div class=\"colonne_1\">
                        <div class=\"colonne_deco\">
                                   <div class=\"style_1\">
                                    <h2><span>Informations :   </span></h2>
                                </div><!-- .style_1 -->
                                <div class=\"style_4\">
                                    <p>

                                    \t<ul>
                                    \t<li> Nom d'utilisateur : ";
        // line 17
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["user"]) ? $context["user"] : null), "getUserName", array()), "html", null, true));
        echo "</li>
                                    \t<li> Adresse email :   ";
        // line 18
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["user"]) ? $context["user"] : null), "getEmail", array()), "html", null, true));
        echo "</li>
                                    \t<li> <a href=\"";
        // line 19
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, call_user_func_array($this->env->getFunction('file_url')->getCallable(), array("user/logout")), "html", null, true));
        echo "\"> Déconnexion</a> </li>
                                    \t</ul>
                                    </p>

                                </div>
                                                                                        
                                   
                                                        
                        </div><!-- colonne_deco -->
                    </div><!-- .colonne_1 -->


                </div><!-- .ligne_1 -->


            </div><!-- / -->


            
        </div>


        <div id=\"navigation\">

            <div id=\"rubrique_niveau_2\">
                <span>Profil</span>

            </div>

                                            
        </div>
    </div>";
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/user.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  69 => 19,  65 => 18,  61 => 17,  43 => 1,);
    }
}
/* <div id="page_deco">*/
/* */
/*         <div id="avec_nav_sans_encadres" class="contenu">*/
/*         	<div>*/
/* */
/*                 <div class="ligne_1">*/
/* */
/*                     <div class="colonne_1">*/
/*                         <div class="colonne_deco">*/
/*                                    <div class="style_1">*/
/*                                     <h2><span>Informations :   </span></h2>*/
/*                                 </div><!-- .style_1 -->*/
/*                                 <div class="style_4">*/
/*                                     <p>*/
/* */
/*                                     	<ul>*/
/*                                     	<li> Nom d'utilisateur : {{ user.getUserName }}</li>*/
/*                                     	<li> Adresse email :   {{ user.getEmail }}</li>*/
/*                                     	<li> <a href="{{ file_url('user/logout') }}"> Déconnexion</a> </li>*/
/*                                     	</ul>*/
/*                                     </p>*/
/* */
/*                                 </div>*/
/*                                                                                         */
/*                                    */
/*                                                         */
/*                         </div><!-- colonne_deco -->*/
/*                     </div><!-- .colonne_1 -->*/
/* */
/* */
/*                 </div><!-- .ligne_1 -->*/
/* */
/* */
/*             </div><!-- / -->*/
/* */
/* */
/*             */
/*         </div>*/
/* */
/* */
/*         <div id="navigation">*/
/* */
/*             <div id="rubrique_niveau_2">*/
/*                 <span>Profil</span>*/
/* */
/*             </div>*/
/* */
/*                                             */
/*         </div>*/
/*     </div>*/
