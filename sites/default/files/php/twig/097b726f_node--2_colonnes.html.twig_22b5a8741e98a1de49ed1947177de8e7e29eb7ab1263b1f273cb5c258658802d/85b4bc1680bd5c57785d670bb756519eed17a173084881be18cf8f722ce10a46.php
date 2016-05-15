<?php

/* themes/upjv/templates/node--2_colonnes.html.twig */
class __TwigTemplate_1180b83382bc205ffbe0bec855eb76b93a1cedfd2393fbed81f4bb2015c1f6c6 extends Twig_Template
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
        $tags = array("if" => 1);
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array('if'),
                array(),
                array()
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
        if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_titre", array()), 0, array())) {
            // line 2
            echo "    ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image", array()), 0, array())) {
                // line 3
                echo "        <div id=\"bandeau_visuel\">


            ";
                // line 6
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image", array()), 0, array()), "html", null, true));
                echo "
        </div>
    ";
            }
            // line 9
            echo "    <div id=\"page_deco\">

        <div id=\"avec_nav_sans_encadres\" class=\"contenu\">

            ";
            // line 13
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_titre", array()), 0, array())) {
                // line 14
                echo "                <h1>";
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_titre", array()), 0, array()), "html", null, true));
                echo "</h1>
            ";
            }
            // line 16
            echo "

            <div>

                <div class=\"ligne_1\">
                    <div class=\"colonne_1 fiftyFifty\">
                        <div class=\"colonne_deco\">
                            ";
            // line 23
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne_1", array()), 0, array())) {
                // line 24
                echo "                                <div class=\"style_1\">
                                    ";
                // line 25
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne_1", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_1 -->  ";
            }
            // line 27
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_collone", array()), 0, array())) {
                // line 28
                echo "                                <div class=\"style_3\">
                                    ";
                // line 29
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_collone", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_3 -->  ";
            }
            // line 30
            echo "</div><!-- colonne_deco -->
                    </div><!-- .colonne_1 -->
                    <div class=\"colonne_2 fiftyFifty\">
                        <div class=\"colonne_deco\">
                            ";
            // line 34
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colo", array()), 0, array())) {
                // line 35
                echo "                                <div class=\"style_4\">
                                    ";
                // line 36
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colo", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_4 -->  ";
            }
            // line 38
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_co", array()), 0, array())) {
                // line 39
                echo "                                <div class=\"style_1\">
                                    ";
                // line 40
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_co", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_1 -->  ";
            }
            // line 41
            echo "</div><!-- colonne_deco -->
                    </div><!-- .colonne_2 --></div><!-- .ligne_1 -->


            </div><!-- / -->


            ";
            // line 48
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_file_share", array()), 0, array())) {
                // line 49
                echo "                <div id=\"partage\">
                    <strong class=\"h2\">Partager</strong>
                    <ul id=\"boutons_actions\">
                        <li id=\"partage_pdf\">
                            <span class=\"fa fa-file\"></span>
                            ";
                // line 54
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_file_share", array()), 0, array()), "html", null, true));
                echo "
                        </li>
                    </ul>
                </div><!-- #partage -->
            ";
            }
            // line 59
            echo "
        </div>


        <div id=\"navigation\">

            <div id=\"rubrique_niveau_2\">
                ";
            // line 66
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["label"]) ? $context["label"] : null), "html", null, true));
            echo "
            </div>
             
     
        </div>
    </div>
";
        }
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/node--2_colonnes.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  165 => 66,  156 => 59,  148 => 54,  141 => 49,  139 => 48,  130 => 41,  125 => 40,  122 => 39,  119 => 38,  114 => 36,  111 => 35,  109 => 34,  103 => 30,  98 => 29,  95 => 28,  92 => 27,  87 => 25,  84 => 24,  82 => 23,  73 => 16,  67 => 14,  65 => 13,  59 => 9,  53 => 6,  48 => 3,  45 => 2,  43 => 1,);
    }
}
/* {% if content.field_sous_titre.0 %}*/
/*     {% if content.field_image.0 %}*/
/*         <div id="bandeau_visuel">*/
/* */
/* */
/*             {{ content.field_image.0 }}*/
/*         </div>*/
/*     {% endif %}*/
/*     <div id="page_deco">*/
/* */
/*         <div id="avec_nav_sans_encadres" class="contenu">*/
/* */
/*             {% if content.field_sous_titre.0 %}*/
/*                 <h1>{{ content.field_sous_titre.0 }}</h1>*/
/*             {% endif %}*/
/* */
/* */
/*             <div>*/
/* */
/*                 <div class="ligne_1">*/
/*                     <div class="colonne_1 fiftyFifty">*/
/*                         <div class="colonne_deco">*/
/*                             {% if content.field_colonne_1.0 %}*/
/*                                 <div class="style_1">*/
/*                                     {{ content.field_colonne_1.0 }}*/
/*                                 </div><!-- .style_1 -->  {% endif %}*/
/*                             {% if content.field_sous_collone.0 %}*/
/*                                 <div class="style_3">*/
/*                                     {{ content.field_sous_collone.0 }}*/
/*                                 </div><!-- .style_3 -->  {% endif %}</div><!-- colonne_deco -->*/
/*                     </div><!-- .colonne_1 -->*/
/*                     <div class="colonne_2 fiftyFifty">*/
/*                         <div class="colonne_deco">*/
/*                             {% if content.field_colo.0 %}*/
/*                                 <div class="style_4">*/
/*                                     {{ content.field_colo.0 }}*/
/*                                 </div><!-- .style_4 -->  {% endif %}*/
/*                             {% if content.field_sous_co.0 %}*/
/*                                 <div class="style_1">*/
/*                                     {{ content.field_sous_co.0 }}*/
/*                                 </div><!-- .style_1 -->  {% endif %}</div><!-- colonne_deco -->*/
/*                     </div><!-- .colonne_2 --></div><!-- .ligne_1 -->*/
/* */
/* */
/*             </div><!-- / -->*/
/* */
/* */
/*             {% if content.field_file_share.0 %}*/
/*                 <div id="partage">*/
/*                     <strong class="h2">Partager</strong>*/
/*                     <ul id="boutons_actions">*/
/*                         <li id="partage_pdf">*/
/*                             <span class="fa fa-file"></span>*/
/*                             {{ content.field_file_share.0 }}*/
/*                         </li>*/
/*                     </ul>*/
/*                 </div><!-- #partage -->*/
/*             {% endif %}*/
/* */
/*         </div>*/
/* */
/* */
/*         <div id="navigation">*/
/* */
/*             <div id="rubrique_niveau_2">*/
/*                 {{ label }}*/
/*             </div>*/
/*              */
/*      */
/*         </div>*/
/*     </div>*/
/* {% endif %}*/
